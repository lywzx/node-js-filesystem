import omit from 'lodash/omit';
import { ReadStream, WriteStream } from 'fs';
import { FileType, FileVisible } from '@filesystem/core/src/enum';
import { InvalidRootException } from '@filesystem/core/src/exceptions';
import { guessMimeType } from '@filesystem/core/src/util/util';
import { defer } from '@filesystem/core/src/util/promise-defer.util';
import { Writable } from 'stream';
import { AbstractFtpAdapter } from './abstract-ftp-adapter';
import { FtpAdapterConstructorConfigInterface } from '../interfaces';
import { DirType, ListContentInfo } from '@filesystem/core/lib/types/local-adpater.types';
import { ConnectionException } from '../exceptions/connection.exception';

export class Ftp extends AbstractFtpAdapter {
  /**
   * @var number
   */
  protected transferMode = 0;

  /**
   * @var boolean
   */
  protected ignorePassiveAddress = true;

  /**
   * @var boolean
   */
  protected recurseManually = false;

  /**
   * @var boolean
   */
  protected utf8 = false;

  /**
   * @var array
   */
  protected configurable: string[] = [
    'host',
    'port',
    'username',
    'password',
    'ssl',
    'timeout',
    'root',
    'permPrivate',
    'permPublic',
    'passive',
    'transferMode',
    'systemType',
    'ignorePassiveAddress',
    'recurseManually',
    'utf8',
    'enableTimestampsOnUnixListings',
  ];

  /**
   * @var {boolean}
   */
  protected isPureFtpd = true;

  constructor(protected config: FtpAdapterConstructorConfigInterface) {
    super(config);
    this.setConfig(config);
  }

  /**
   * Set the transfer mode.
   *
   * @param {number} mode
   *
   * @return this
   */
  public setTransferMode(mode: number) {
    this.transferMode = mode;

    return this;
  }

  /**
   * Set if Ssl is enabled.
   *
   * @param {boolean} ssl
   *
   * @return this
   */
  public setSsl(ssl: boolean) {
    this.ssl = ssl;

    return this;
  }

  /**
   * Set if passive mode should be used.
   *
   * @param {boolean} passive
   */
  public setPassive(passive = true) {
    this.passive = passive;
  }

  /**
   * @param {boolean} ignorePassiveAddress
   */
  public setIgnorePassiveAddress(ignorePassiveAddress: boolean) {
    this.ignorePassiveAddress = ignorePassiveAddress;
  }

  /**
   * @param {boolean} recurseManually
   */
  public setRecurseManually(recurseManually: boolean) {
    this.recurseManually = recurseManually;
  }

  /**
   * @param {boolean} utf8
   */
  public setUtf8(utf8: boolean) {
    this.utf8 = utf8;
  }

  /**
   * Connect to the FTP server.
   */
  public async connect() {
    return this.client.connect(this.getHost(), this.getPort());
  }

  /**
   * Set the connection to UTF-8 mode.
   */
  protected async setUtf8Mode() {
    this.client.ftp.encoding;

    const response = await this.client.send('OPTS UTF8 ON');

    if (this.client.ftp.encoding === 'utf8') {
      throw new ConnectionException(`Could not set UTF-8 mode for connection: ${this.getHost()} :: ${this.getPort()}`);
    }
    /*if (this.utf8) {
      response = ftp_raw(this.connection, "OPTS UTF8 ON");
      if (substr(response[0], 0, 3) !== '200') {
        throw new ConnectionRuntimeException(
          'Could not set UTF-8 mode for connection: ' . this.getHost() . '::' . this.getPort()
      );
      }
    }*/
  }

  /**
   * Set the connections to passive mode.
   *
   * @throws ConnectionRuntimeException
   */
  protected setConnectionPassiveMode() {
    /* if (is_bool(this.ignorePassiveAddress) && defined('FTP_USEPASVADDRESS')) {
      ftp_set_option(this.connection, FTP_USEPASVADDRESS, ! this.ignorePassiveAddress);
    }

    if ( ! ftp_pasv(this.connection, this.passive)) {
      throw new ConnectionRuntimeException(
        'Could not set passive mode for connection: ' . this.getHost() . '::' . this.getPort()
    );
    }*/
  }

  /**
   * Set the connection root.
   */
  protected async setConnectionRoot() {
    const root = this.getRoot();
    if (root) {
      // TODO check
      try {
        await this.client.cd(root);
      } catch (e) {
        throw new InvalidRootException(`Root is invalid or does not exist: ${this.getRoot()}`);
      }
    }

    // Store absolute path for further reference.
    // This is needed when creating directories and
    // initial root was a relative path, else the root
    // would be relative to the chdir'd path.
    this.root = await this.client.pwd();
  }

  /**
   * Login.
   *
   * @throws ConnectionRuntimeException
   */
  public async login() {
    try {
      await this.client.access(omit(this.config, ['timeout']));
    } catch (e) {}
    if (this.client.closed) {
      throw new ConnectionException(
        `Could not login with connection: ${this.getHost()} :: ${this.getPort()}, username: ${this.getUsername()}`
      );
    }
  }

  /**
   * Disconnect from the FTP server.
   */
  public disconnect() {
    if (!this.client.closed) {
      this.client.close();
    }
  }

  /**
   * @inheritdoc
   */
  public async write(path: string, contents: string | Buffer, config: any) {
    /*stream = fopen('php://temp', 'w+b');
  fwrite(stream, contents);
  rewind(stream);
  result = this.writeStream(path, stream, config);
  fclose(stream);

  if (result === false) {
  return false;
}

result['contents'] = contents;
result['mimetype'] = config->get('mimetype') ?: Util::guessMimeType(path, contents);

return result;*/

    return {} as any;
  }

  /**
   * @inheritdoc
   */
  public async writeStream(path: string, resource: ReadStream, config: any) {
    /*this.ensureDirectory(Util::dirname(path));

  if ( ! ftp_fput(this.getConnection(), path, resource, this.transferMode)) {
    return false;
  }

  if (visibility = config->get('visibility')) {
    this.setVisibility(path, visibility);
  }

  type = 'file';

  return compact('type', 'path', 'visibility');*/
    return {
      type: '',
      path: '',
      visibility: '',
    } as any;
  }

  /**
   * @inheritdoc
   */
  public async update(path: string, contents: string | Buffer, config: any) {
    return {} as any;
    //return this.write(path, contents, config);
  }

  /**
   * @inheritdoc
   */
  public async updateStream(path: string, resource: ReadStream, config: any) {
    return {} as any;
    //return this.writeStream(path, resource, config);
  }

  /**
   * @inheritdoc
   */
  public async rename(path: string, newPath: string): Promise<boolean> {
    try {
      await this.client.rename(path, newPath);
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * @inheritdoc
   */
  public async delete(path: string): Promise<boolean> {
    try {
      await this.client.remove(path);
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * @inheritdoc
   */
  public async deleteDir(dirname: string): Promise<boolean> {
    try {
      await this.client.removeDir(dirname);
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * @inheritdoc
   */
  public async createDir(dirname: string, config?: any): Promise<DirType> {
    await this.client.ensureDir(dirname);
    return {
      type: FileType.dir,
      path: dirname,
    };
  }

  /**
   * Create a directory.
   *
   * @param string   directory
   * @param resource connection
   *
   * @return bool
   */
  protected async createActualDirectory(directory: string): Promise<boolean> {
    try {
      await this.client.ensureDir(directory);
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * @inheritdoc
   */
  public async getMetadata(path: string) {
    if (path === '') {
      return {
        type: FileType.dir,
        path: '',
      };
    }
    let isDir = false;
    try {
      const result = await this.client.cd(path);
      isDir = true;
    } catch (e) {
      const message = (e.message || '').toLowerCase();
      if (!(message.includes('directory') && message.includes('not'))) {
        throw e;
      }
    }

    if (isDir) {
      await this.setConnectionRoot();
      return {
        type: FileType.dir,
        path,
      };
    }

    const result = await this.client.list(path);

    return false;
    return {} as any;
    /*if (@ftp_chdir(this.getConnection(), path) === true) {
    this.setConnectionRoot();

    return ['type' => 'dir', 'path' => path];
  }

  listing = this.ftpRawlist('-A', str_replace('*', '\\*', path));

  if (empty(listing) || in_array('total 0', listing, true)) {
    return false;
  }

  if (preg_match('/.* not found/', listing[0])) {
    return false;
  }

  if (preg_match('/^total [0-9]*$/', listing[0])) {
    array_shift(listing);
  }

  return this.normalizeObject(listing[0], '');*/
  }

  /**
   * @inheritdoc
   */
  public async getMimetype(path: string) {
    const metadata = await this.getMetadata(path);
    if (!metadata) {
      return false;
    }

    const mimetype = await guessMimeType(path);

    if (mimetype) {
      (metadata as any)['mimetype'] = mimetype;
      return metadata;
    }

    return false;
  }

  /**
   * @inheritdoc
   */
  public async getTimestamp(path: string) {
    try {
      const timestamp = await this.client.lastMod(path);
      return {
        path,
        timestamp,
      };
    } catch (e) {
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  public async read(path: string) {
    const client = this.client;
    const promiseDefer = defer<any>();
    let result: Buffer | string;
    const wS = new Writable({
      autoDestroy: true,
      write(chunk: any, encoding: string, callback: (error?: Error | null) => void) {
        if (encoding === 'buffer') {
          if (!result) {
            result = chunk;
          } else {
            result = Buffer.concat([result, chunk]);
          }
        }
        callback(null);
      },
      final(callback: (error?: Error | null) => void) {
        callback();
        if (result === undefined) {
          promiseDefer.reject(new Error(''));
        } else {
          promiseDefer.resolve(result);
        }
      },
    });
    await client.downloadTo(wS, path);

    return promiseDefer.promise;
  }

  /**
   * @inheritdoc
   */
  public readStream(path: string) {
    return {} as any;
    /*stream = fopen('php://temp', 'w+b');
  result = ftp_fget(this.getConnection(), stream, path, this.transferMode);
  rewind(stream);

  if ( ! result) {
    fclose(stream);

    return false;
  }

  return ['type' => 'file', 'path' => path, 'stream' => stream];*/
  }

  /**
   * @inheritdoc
   */
  public setVisibility(path: string, visibility: FileVisible | string) {
    return {} as any;
    /*mode = visibility === AdapterInterface::VISIBILITY_PUBLIC ? this.getPermPublic() : this.getPermPrivate();

  if ( ! ftp_chmod(this.getConnection(), mode, path)) {
    return false;
  }

  return compact('path', 'visibility');*/
  }

  /**
   * @inheritdoc
   *
   * @param {string} directory
   * @param {boolean} recursive
   */
  protected async listDirectoryContents(directory = '', recursive = true): Promise<ListContentInfo[]> {
    // return this.client.send(`LIST ${directory} -a`);
    /*directory = str_replace('*', '\\*', directory);

  if (recursive && this.recurseManually) {
  return this.listDirectoryContentsRecursive(directory);
}

  options = recursive ? '-alnR' : '-aln';
  listing = this.ftpRawlist(options, directory);

  return listing ? this.normalizeListing(listing, directory) : [];*/
    directory = directory.replace('*', '\\*');
    if (recursive && this.recurseManually) {
      return this.listDirectoryContentsRecursive(directory);
    }

    const list = await this.client.list(directory);
    return this.normalizeListing(list);
  }

  /**
   * @inheritdoc
   *
   * @param string directory
   */
  protected async listDirectoryContentsRecursive(directory: string): Promise<ListContentInfo[]> {
    /*listing = this.normalizeListing(this.ftpRawlist('-aln', directory) ?: [], directory);
  output = [];

  foreach (listing as item) {
  output[] = item;
  if (item['type'] !== 'dir') {
    continue;
  }
  output = array_merge(output, this.listDirectoryContentsRecursive(item['path']));
}

  return output;*/
    return [];
  }

  /**
   * Check if the connection is open.
   *
   * @return bool
   *
   * @throws ConnectionErrorException
   */
  public isConnected() {
    return !this.client.closed;
  }

  /**
   * @return bool
   */
  protected isPureFtpdServer() {
    /*response = ftp_raw(this.connection, 'HELP');

  return stripos(implode(' ', response), 'Pure-FTPd') !== false;*/
  }

  /**
   * The ftp_rawlist function with optional escaping.
   *
   * @param string options
   * @param string path
   *
   * @return array
   */
  protected ftpRawlist(options: string, path: string) {
    /*connection = this.getConnection();

  if (this.isPureFtpd) {
    path = str_replace(' ', '\ ', path);
  }

  return ftp_rawlist(connection, options . ' ' . path);*/
  }

  private getRawExecResponseCode(command: string) {
    /*response = @ftp_raw(this.connection, trim(command));

  return (int) preg_replace('/\D/', '', implode(' ', response));*/
  }

  /**
   * Copy a file.
   *
   * @param {string} path
   * @param {string} newPath
   *
   * @return bool
   */
  public async copy(path: string, newPath: string) {
    return {} as any;
    /*$response = $this->readStream($path);

    if ($response === false || ! is_resource($response['stream'])) {
      return false;
    }

    $result = $this->writeStream($newpath, $response['stream'], new Config());

    if ($result !== false && is_resource($response['stream'])) {
      fclose($response['stream']);
    }

    return $result !== false;*/
  }
}
