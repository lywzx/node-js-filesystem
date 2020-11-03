import { Client, FileInfo } from 'basic-ftp';
import upperFirst from 'lodash/upperFirst';
import isFunction from 'lodash/isFunction';
import isNumber from 'lodash/isNumber';
import { isNumeric, stringChunk } from '@filesystem/core/src/util/util';
import { AbstractAdapter, FileVisible, ListContentInfo, NotSupportedException } from '@filesystem/core';
import { FtpAdapterConstructorConfigInterface } from '../interfaces';
import { FileType } from '@filesystem/core/lib/src';

export abstract class AbstractFtpAdapter extends AbstractAdapter {
  /**
   * @var Client
   */
  public client: Client;

  /**
   * @var string
   */
  protected host: string | undefined;

  /**
   * @var int
   */
  protected port = 21;

  /**
   * @var bool
   */
  protected ssl = false;

  /**
   * @var int
   */
  protected timeout = 90;

  /**
   * @var bool
   */
  protected passive = true;

  /**
   * @var string
   */
  protected separator = '/';

  /**
   * @var string|null
   */
  protected root: string | null | undefined;

  /**
   * @var int
   */
  protected permPublic = 0o744;

  /**
   * @var int
   */
  protected permPrivate = 0o700;

  /**
   * @var array
   */
  protected configurable: string[] = [];

  /**
   * @var string
   */
  protected systemType: string | undefined;

  /**
   * @var SafeStorage
   */
  protected safeStorage: any;

  /**
   * True to enable timestamps for FTP servers that return unix-style listings.
   *
   * @var boolR
   */
  protected enableTimestampsOnUnixListings = false;

  /**
   * Constructor.
   *
   * @param {FtpAdapterConstructorConfigInterface} config
   */
  protected constructor(protected config: FtpAdapterConstructorConfigInterface) {
    super();
    this.client = new Client(config.timeout || 3000);
  }
  /* public __construct(array $config)
{
  $this->safeStorage = new SafeStorage();
  $this->setConfig($config);
}*/

  /**
   * Set the config.
   *
   * @param {FtpAdapterConstructorConfigInterface} config
   *
   * @return this
   */
  public setConfig(config: FtpAdapterConstructorConfigInterface) {
    for (const setting of this.configurable) {
      if (!(setting in config)) {
        continue;
      }
      const method = 'set' + upperFirst(setting);
      if (isFunction((this as any)[method])) {
        (this as any)[method]((config as any)[setting]);
      }
    }

    return this;
  }

  /**
   * Returns the host.
   *
   * @return string
   */
  public getHost() {
    return this.host;
  }

  /**
   * Set the host.
   *
   * @param {string} host
   *
   * @return this
   */
  public setHost(host: string) {
    this.host = host;

    return this;
  }

  /**
   * Set the public permission value.
   *
   * @param {number} permPublic
   *
   * @return this
   */
  public setPermPublic(permPublic: number) {
    this.permPublic = permPublic;

    return this;
  }

  /**
   * Set the private permission value.
   *
   * @param {number} permPrivate
   *
   * @return this
   */
  public setPermPrivate(permPrivate: number) {
    this.permPrivate = permPrivate;

    return this;
  }

  /**
   * Returns the ftp port.
   *
   * @return int
   */
  public getPort() {
    return this.port;
  }

  /**
   * Returns the root folder to work from.
   *
   * @return string
   */
  public getRoot() {
    return this.root;
  }

  /**
   * Set the ftp port.
   *
   * @param {number|string} port
   *
   * @return this
   */
  public setPort(port: number | string) {
    this.port = parseInt(port.toString(), 10);

    return this;
  }

  /**
   * Set the root folder to work from.
   *
   * @param {string} root
   *
   * @return this
   */
  public setRoot(root: string) {
    this.root = root.replace(/[\\/]+$/, '') + this.separator;

    return this;
  }

  /**
   * Returns the ftp username.
   *
   * @return {string} username
   */
  public getUsername() {
    const username = this.config.user;
    return username ? username : 'anonymous';
  }

  /**
   * Set ftp username.
   *
   * @param {string} username
   *
   * @return this
   */
  /*public setUsername(username: string) {
    /!*$this->safeStorage->storeSafely('username', $username);

  return $this;*!/
    return this;
  }*/

  /**
   * Returns the password.
   *
   * @return string password
   */
  public getPassword() {
    return this.config.password;
  }

  /**
   * Set the ftp password.
   * Set the ftp password.
   *
   * @param {string} password
   *
   * @return this
   */
  /*public setPassword(password: string) {
    //$this->safeStorage->storeSafely('password', $password);

    return this;
  }*/

  /**
   * Returns the amount of seconds before the connection will timeout.
   *
   * @return {number}
   */
  public getTimeout() {
    return this.timeout;
  }

  /**
   * Set the amount of seconds before the connection should timeout.
   *
   * @param {number|string} timeout
   *
   * @return this
   */
  public setTimeout(timeout: number | string) {
    this.timeout = parseInt(timeout.toString(), 10);

    return this;
  }

  /**
   * Return the FTP system type.
   *
   * @return string
   */
  public getSystemType() {
    return this.systemType;
  }

  /**
   * Set the FTP system type (windows or unix).
   *
   * @param {string} systemType
   *
   * @return this
   */
  public setSystemType(systemType: string) {
    this.systemType = systemType.toLowerCase();

    return this;
  }

  /**
   * True to enable timestamps for FTP servers that return unix-style listings.
   *
   * @param {boolean} bool
   *
   * @return this
   */
  public setEnableTimestampsOnUnixListings(bool = false) {
    this.enableTimestampsOnUnixListings = bool;

    return this;
  }

  /**
   * @inheritdoc
   */
  public listContents(directory = '', recursive = false): Promise<ListContentInfo[]> {
    return this.listDirectoryContents(directory, recursive);
  }

  protected abstract listDirectoryContents(directory: string, recursive: boolean): Promise<ListContentInfo[]>;

  /**
   * Normalize a directory listing.
   *
   * @param {object}  listing
   * @param {string} prefix
   *
   * @return array directory listing
   */
  protected normalizeListing(listing: FileInfo[], prefix = '') {
    /*$base = $prefix;
  $result = [];
  $listing = $this->removeDotDirectories($listing);

  while ($item = array_shift($listing)) {
    if (preg_match('#^.*:$#', $item)) {
      $base = preg_replace('~^\./!*|:$~', '', $item);
      continue;
    }

    $result[] = $this->normalizeObject($item, $base);
  }

  return $this->sortListing($result);*/
    return this.sortListing(listing.map( it => this.normalizeObject(it, prefix)));



    const base = prefix;
    const result = [];
    const list = this.removeDotDirectories(listing);
  }

  /**
   * Sort a directory listing.
   *
   * @param {object} result
   *
   * @return {object} sorted listing
   */
  protected sortListing(result: Record<string, unknown>) {
    /*$compare = ($one, $two) {
    return strnatcmp($one['path'], $two['path']);
  };

  usort($result, $compare);*/

    return result;
  }

  /**
   * Normalize a file entry.
   *
   * @param {FileInfo} item
   * @param {string} base
   *
   * @return array normalized file array
   *
   * @throws NotSupportedException
   */
  protected async normalizeObject(item: FileInfo, base: string) {
    const systemType = this.systemType ? this.systemType : await this.detectSystemType(item);

    if (systemType === 'unix') {
      return this.normalizeUnixObject(item, base);
    } else if (systemType === 'windows') {
      return this.normalizeWindowsObject(item, base);
    }

    throw new NotSupportedException(`The FTP system type '${systemType}' is currently not supported.`);
  }

  /**
   * Normalize a Unix file entry.
   *
   * Given $item contains:
   *    '-rw-r--r--   1 ftp      ftp           409 Aug 19 09:01 file1.txt'
   *
   * This will return:
   * [
   *   'type' => 'file',
   *   'path' => 'file1.txt',
   *   'visibility' => 'public',
   *   'size' => 409,
   *   'timestamp' => 1566205260
   * ]
   *
   * @param {FileInfo} item
   * @param {string} base
   *
   * @return array normalized file array
   */
  protected normalizeUnixObject(item: FileInfo, base: string): File {
    const type = item.isFile ? FileType.file : item.isDirectory ? FileType.dir : FileType.link;
    return {
      type,
    };
    /*$item = preg_replace('#\s+#', ' ', trim($item), 7);

  if (count(explode(' ', $item, 9)) !== 9) {
    throw new RuntimeException("Metadata can't be parsed from item '$item' , not enough parts.");
  }

  list($permissions, /!* $number *!/, /!* $owner *!/, /!* $group *!/, $size, $month, $day, $timeOrYear, $name) = explode(' ', $item, 9);
  $type = $this->detectType($permissions);
  $path = $base === '' ? $name : $base . $this->separator . $name;

  if ($type === 'dir') {
    return compact('type', 'path');
  }

  $permissions = $this->normalizePermissions($permissions);
  $visibility = $permissions & 0044 ? AdapterInterface::VISIBILITY_PUBLIC : AdapterInterface::VISIBILITY_PRIVATE;
  $size = (int) $size;

  $result = compact('type', 'path', 'visibility', 'size');
  if ($this->enableTimestampsOnUnixListings) {
    $timestamp = $this->normalizeUnixTimestamp($month, $day, $timeOrYear);
    $result += compact('timestamp');
  }

  return $result;*/
  }

  /**
   * Only accurate to the minute (current year), or to the day.
   *
   * Inadequacies in timestamp accuracy are due to limitations of the FTP 'LIST' command
   *
   * Note: The 'MLSD' command is a machine-readable replacement for 'LIST'
   * but many FTP servers do not support it :(
   *
   * @param {string} month      e.g. 'Aug'
   * @param {string} day        e.g. '19'
   * @param {string} timeOrYear e.g. '09:01' OR '2015'
   *
   * @return int
   */
  protected normalizeUnixTimestamp(month: string, day: string, timeOrYear: string) {
    let year: string, hour, minute, seconds;
    if (isNumeric(timeOrYear)) {
      year = timeOrYear;
      hour = '00';
      minute = '00';
      seconds = '00';
    } else {
      year = new Date().getFullYear().toString();
      [hour, minute] = timeOrYear.split(':');
      seconds = '00';
    }
    const dateTime = new Date(
      parseInt(year),
      parseInt(month),
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(seconds)
    );

    return dateTime.getTime();
  }

  /**
   * Normalize a Windows/DOS file entry.
   *
   * @param {string} item
   * @param {string} base
   *
   * @return array normalized file array
   */
  protected normalizeWindowsObject(item: FileInfo, base: string) {
    const type = item.isFile ? FileType.file : item.isSymbolicLink ? FileType.link : FileType.dir;

    return {
      type,
      visibility: FileVisible.VISIBILITY_PUBLIC,
      size: item.size,
      timestamp: item.modifiedAt,
    };
  }

  /**
   * Get the system type from a listing item.
   *
   * @param {string} item
   *
   * @return string the system type
   */
  protected async detectSystemType(item: FileInfo) {
    const result = await this.client.send('SYSTEM');
    return /^[0-9]{2,4}-[0-9]{2}-[0-9]{2}/.test(result.message) ? 'windows' : 'unix';
  }


  /**
   * Normalize a permissions string.
   *
   * @param {string|number} permissions
   *
   * @return int
   */
  protected normalizePermissions(permissions: string | number) {
    if (isNumber(permissions)) {
      return permissions & 0o777;
    }
    // remove the type identifier
    permissions = permissions.substr(1);

    // map the string rights to the numeric counterparts
    permissions = permissions.replace(/[-rwx]/g, ($0: string) => {
      return (({
        '-': '0',
        r: '4',
        w: '2',
        x: '1',
      } as any)[$0] || $0) as string;
    });

    // split up the permission groups
    const chunkPermission = stringChunk(permissions, 3);

    return parseInt(
      chunkPermission
        .map((item) => {
          return item.split('').reduce((init: number, next: string) => init + parseInt(next, 10), 0);
        })
        .join(''),
      10
    ).toString(8);
  }

  /**
   * Filter out dot-directories.
   *
   * @param {array} list
   *
   * @return array
   */
  /*public removeDotDirectories(list: FileInfo[]): FileInfo[] {
    return list.filter((line: FileInfo) => {
      return line !== '' && /.* \.(\.)?$|^total/.test(line);
    });
  }*/

  /**
   * @inheritdoc
   */
  public async has(path: string) {
    try {
      const result = await this.client.sendIgnoringError('pwd');
      debugger;
    } catch (e) {
      debugger;
    }
    return true;
    //this.client.lastMod(path);
    // return $this->getMetadata($path);
  }

  /**
   * @inheritdoc
   */
  public getSize(path: string) {
    return this.getMetadata(path);
  }

  /**
   * @inheritdoc
   */
  public getVisibility(path: string) {
    return this.getMetadata(path) as any;
  }

  /**
   * Ensure a directory exists.
   *
   * @param {string} dirname
   */
  public async ensureDirectory(dirname: string) {
    if (dirname !== '' && !(await this.has(dirname))) {
      await this.createDir(dirname, {});
    }
  }

  /**
   * @return mixed
   */
  public getConnection() {
    /*$tries = 0;

  while ( ! $this->isConnected() && $tries < 3) {
  $tries++;
  $this->disconnect();
  $this->connect();
}

  return $this->connection;*/
  }

  /**
   * Get the public permission value.
   *
   * @return int
   */
  public getPermPublic() {
    //return $this->permPublic;
  }

  /**
   * Get the private permission value.
   *
   * @return int
   */
  public getPermPrivate() {
    //return $this->permPrivate;
  }

  /**
   * Disconnect on destruction.
   */
  public __destruct() {
    //$this->disconnect();
  }

  /**
   * Establish a connection.
   */
  public abstract connect(): any;

  /**
   * Close the connection.
   */
  public abstract disconnect(): any;

  /**
   * Check if a connection is active.
   *
   * @return bool
   */
  public abstract isConnected(): any;
}