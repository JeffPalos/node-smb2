import Tree from "./Tree";
import { EventEmitter } from "events";
import * as util from "../protocol/util";
import Response from "../protocol/smb2/Response";
import StatusCode from "../protocol/smb2/StatusCode";
import PacketType from "../protocol/smb2/PacketType";
import FileAttribute from "../protocol/smb2/FileAttribute";
import ShareAccessType from "../protocol/smb2/ShareAccessType";
import DirectoryAccess from "../protocol/smb2/DirectoryAccess";
import { CreateOptions } from "../protocol/smb2/packets/Create";
import * as structureUtil from "../protocol/structureUtil";
import DirectoryEntry from "../protocol/models/DirectoryEntry";
import { InfoType, FileInfoClass } from "../protocol/smb2/packets/SetInfo";
import CreateDispositionType from "../protocol/smb2/CreateDispositionType";
import { Flags as ChangeNotifyFlags } from "../protocol/smb2/packets/ChangeNotify";

interface OpenOptions {
  desiredAccess?: DirectoryAccess;
  createDisposition?: CreateDispositionType;
  createOptions?: CreateOptions;
}

interface Directory {
  on(event: "open" | "close", callback: (directory: Directory) => void): this;
  on(event: "change", callback: (response: Response) => void): this;

  once(event: "open" | "close", callback: (directory: Directory) => void): this;
  once(event: "change", callback: (response: Response) => void): this;
}

class Directory extends EventEmitter {
  public _id: string;
  public isOpen: boolean = false;
  public watching: boolean = false;
  private watchingMessageIds: bigint[] = [];
  private watchRecursive: boolean;

  constructor(
    private tree: Tree
  ) {
    super();
  }

  async open(path: string, options: OpenOptions = {}) {
    if (this.isOpen) return;

    const buffer = Buffer.from(util.toWindowsFilePath(path), "ucs2");
    const response = await this.tree.request({ type: PacketType.Create }, {
      buffer,
      desiredAccess: typeof options.desiredAccess === "number" ?
        options.desiredAccess :
        (
          DirectoryAccess.ListDirectory |
          DirectoryAccess.ReadAttributes |
          DirectoryAccess.Synchronize
        ),
      fileAttributes: FileAttribute.Directory,
      shareAccess:
        ShareAccessType.Read |
        ShareAccessType.Write |
        ShareAccessType.Delete,
      createDisposition: typeof options.createDisposition === "number" ?
        options.createDisposition :
        CreateDispositionType.Open,
      createOptions: typeof options.createOptions === "number" ?
        options.createOptions :
        CreateOptions.None,
      nameOffset: 0x0078,
      createContextsOffset: 0x007a + buffer.length
    });

    this._id = response.body.fileId as string;
    this.isOpen = true;

    this.emit("open", this);
  }

  async create(path: string) {
    await this.open(path, {
      createDisposition: CreateDispositionType.Create,
      createOptions: CreateOptions.Directory
    });
  }

  async watch(recursive: boolean = true) {
    if (this.watching) return;
    this.watching = true;
    this.watchRecursive = recursive;

    await this.requestWatch();

    this.tree.session.client.addListener("changeNotify", this.onChangeNotify);
  }

  async unwatch() {
    if (!this.watching) return;
    this.watching = false;

    this.tree.session.client.removeListener("changeNotify", this.onChangeNotify);

    await this.close();
  }

  private onChangeNotify = async (response: Response) => {
    const messageId = response.header.messageId;
    const messageIdIndex = this.watchingMessageIds.indexOf(messageId);

    if (messageIdIndex !== -1) {
      this.watchingMessageIds.splice(messageIdIndex, 1);
      this.emit("change", response);

      await this.requestWatch();
    }
  };

  private async requestWatch() {
    const request = this.tree.createRequest(
      { type: PacketType.ChangeNotify },
      {
        flags: this.watchRecursive ?
          ChangeNotifyFlags.WatchTreeRecursively :
          ChangeNotifyFlags.None,
        fileId: this._id
      }
    );
    this.watchingMessageIds.push(request.header.messageId);

    const response = await this.tree.session.client.send(request);
    if (
      response.header.status !== StatusCode.Success &&
      response.header.status !== StatusCode.Pending
    ) throw new Error(`ChangeNotify: ${structureUtil.parseEnumValue(StatusCode, response.header.status)} (${response.header.status})`);

    return response;
  }

  async flush() {
    await this.tree.request({
      type: PacketType.Flush
    }, {
      fileId: this._id
    });
  }
  
  async read(): Promise<DirectoryEntry[]> {
    const allEntries: DirectoryEntry[] = [];
    const STATUS_NO_MORE_FILES = 0x80000006;

    while (true) {
      let response;

      try {
        response = await this.tree.request(
          { type: PacketType.QueryDirectory },
          {
            fileId: this._id,
            buffer: Buffer.from('*', 'ucs2'),
          }
        );
      } catch (error: any) {
        // ✅ Normal case: end of file reading
        if (
          error.status === STATUS_NO_MORE_FILES ||
          error.code === 'STATUS_NO_MORE_FILES' ||
          Number(error?.header?.status) === STATUS_NO_MORE_FILES
        ) {
          break;
        }

        // 🚨 Real error case
        console.error('❌ Unexpected SMB QueryDirectory error:', error);
        throw error;
      }

      const status = Number(response.header?.status);

      // ✅ If the server indicates that there are no more files
      if (status === STATUS_NO_MORE_FILES) {
        break;
      }

      // ✅ If files have been received
      if (response.data && response.data.length > 0) {
        const entries = response.data.filter(
          (x) => x.filename !== '.' && x.filename !== '..'
        );
        allEntries.push(...entries);
      }

      // 🧩 If the directory is empty
      if (!response.data || response.data.length === 0) {
        break;
      }

      // 🛑 Anti-infinite loop safety
      if (allEntries.length > 200_000) {
        console.warn('⚠️ Directory.read(): loop stopped, too many entries');
        break;
      }
    }

  return allEntries;
}

  async exists(path: string) {
    try {
      await this.open(path);
    } catch (err) {
      if (
        err.header.status === StatusCode.FileNameNotFound ||
        err.header.status === StatusCode.FilePathNotFound
      ) {
        return false;
      }
      throw err;
    }

    return true;
  }

  async remove() {
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(1, 0);

    await this.setInfo(FileInfoClass.DispositionInformation, buffer);
  }

  async rename(newPath: string) {
    const newPathUCS2 = Buffer.from(newPath, "ucs2");
    const buffer = Buffer.alloc(1 + 7 + 8 + 4 + newPathUCS2.length);

    buffer.fill(0x00);
    buffer.writeUInt8(1, 0);
    buffer.writeUInt32LE(newPathUCS2.length, 16);
    buffer.fill(newPathUCS2, 20);

    await this.setInfo(FileInfoClass.RenameInformation, buffer);
  }

  async setInfo(fileInfoClass: number, buffer: Buffer) {
    await this.tree.request({ type: PacketType.SetInfo }, {
      infoType: InfoType.File,
      fileId: this._id,
      fileInfoClass,
      buffer
    });
  }

  async close() {
    if (this.watching) return await this.unwatch();
    if (!this.isOpen) return;
    this.isOpen = false;

    await this.tree.request({ type: PacketType.Close }, { fileId: this._id });

    this.emit("close", this);
  }
}

export default Directory;