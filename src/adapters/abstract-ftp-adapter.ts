import { FtpAdapterConstructorConfigInterface } from '../interfaces/ftp-adapter.interface';
import { AbstractAdapter } from './abstract-adapter';
import { Client } from 'basic-ftp';
import { upperFirst, isFunction, first, isNumber, chunk } from 'lodash';
import { stringChunk } from '../util/util';

export abstract class AbstractFtpAdapter extends AbstractAdapter {
  /**
   * @var Client
   */
  protected client: Client;

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
  public constructor(protected config: FtpAdapterConstructorConfigInterface) {
    super();
    this.client = new Client(config.timeout || 3000);
    this.setConfig(config);
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
    //$username = $this->safeStorage->retrieveSafely('username');
    //return $username !== null ? $username : 'anonymous';
  }

  /**
   * Set ftp username.
   *
   * @param {string} username
   *
   * @return this
   */
  public setUsername(username: string) {
    /*$this->safeStorage->storeSafely('username', $username);

  return $this;*/
    return this;
  }

  /**
   * Returns the password.
   *
   * @return string password
   */
  public getPassword() {
    //return $this->safeStorage->retrieveSafely('password');
  }

  /**
   * Set the ftp password.
   *
   * @param {string} password
   *
   * @return this
   */
  public setPassword(password: string) {
    //$this->safeStorage->storeSafely('password', $password);

    return this;
  }

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
  public listContents(directory = '', recursive = false) {
    return this.listDirectoryContents(directory, recursive);
  }

  protected abstract listDirectoryContents(directory: string, recursive: boolean): Promise<any>;

  /**
   * Normalize a directory listing.
   *
   * @param {object}  listing
   * @param {string} prefix
   *
   * @return array directory listing
   */
  protected normalizeListing(listing: object, prefix = '') {
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
  }

  /**
   * Sort a directory listing.
   *
   * @param {object} result
   *
   * @return {object} sorted listing
   */
  protected sortListing(result: object) {
    /*$compare = ($one, $two) {
    return strnatcmp($one['path'], $two['path']);
  };

  usort($result, $compare);*/

    return result;
  }

  /**
   * Normalize a file entry.
   *
   * @param {string} item
   * @param {string} base
   *
   * @return array normalized file array
   *
   * @throws NotSupportedException
   */
  protected normalizeObject(item: string, base: string) {
    /*$systemType = $this->systemType ?: $this->detectSystemType($item);

  if ($systemType === 'unix') {
    return $this->normalizeUnixObject($item, $base);
  } elseif ($systemType === 'windows') {
  return $this->normalizeWindowsObject($item, $base);
}

  throw NotSupportedException::forFtpSystemType($systemType);*/
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
   * @param {string} item
   * @param {string} base
   *
   * @return array normalized file array
   */
  protected normalizeUnixObject(item: string, base: string) {
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
    /*if (is_numeric($timeOrYear)) {
    $year = $timeOrYear;
    $hour = '00';
    $minute = '00';
    $seconds = '00';
  } else {
    $year = date('Y');
    list($hour, $minute) = explode(':', $timeOrYear);
    $seconds = '00';
  }
  $dateTime = DateTime::createFromFormat('Y-M-j-G:i:s', "{$year}-{$month}-{$day}-{$hour}:{$minute}:{$seconds}");

  return $dateTime->getTimestamp();*/
  }

  /**
   * Normalize a Windows/DOS file entry.
   *
   * @param {string} item
   * @param {string} base
   *
   * @return array normalized file array
   */
  protected normalizeWindowsObject(item: string, base: string) {
    /*$item = preg_replace('#\s+#', ' ', trim($item), 3);

  if (count(explode(' ', $item, 4)) !== 4) {
    throw new RuntimeException("Metadata can't be parsed from item '$item' , not enough parts.");
  }

  list($date, $time, $size, $name) = explode(' ', $item, 4);
  $path = $base === '' ? $name : $base . $this->separator . $name;

  // Check for the correct date/time format
  $format = strlen($date) === 8 ? 'm-d-yH:iA' : 'Y-m-dH:i';
  $dt = DateTime::createFromFormat($format, $date . $time);
  $timestamp = $dt ? $dt->getTimestamp() : (int) strtotime("$date $time");

  if ($size === '<DIR>') {
    $type = 'dir';

    return compact('type', 'path', 'timestamp');
  }

  $type = 'file';
  $visibility = AdapterInterface::VISIBILITY_PUBLIC;
  $size = (int) $size;

  return compact('type', 'path', 'visibility', 'size', 'timestamp');*/
  }

  /**
   * Get the system type from a listing item.
   *
   * @param {string} item
   *
   * @return string the system type
   */
  protected async detectSystemType(item: string) {
    const result = await this.client.send('SYSTEM');
    return /^[0-9]{2,4}-[0-9]{2}-[0-9]{2}/.test(result.message) ? 'windows' : 'unix';
  }

  /**
   * Get the file type from the permissions.
   *
   * @param {string} permissions
   *
   * @return string file type
   */
  protected async detectType(permissions: string) {
    // const result = await this.client.send(`RSTATUS ${}`)
    return first(permissions) === 'd' ? 'dir' : 'file';
    //return substr($permissions, 0, 1) === 'd' ? 'dir' : 'file';
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
    /*if (is_numeric($permissions)) {
    return ((int) $permissions) & 0777;
  }

  // remove the type identifier
  $permissions = substr($permissions, 1);

  // map the string rights to the numeric counterparts
  $map = ['-' => '0', 'r' => '4', 'w' => '2', 'x' => '1'];
  $permissions = strtr($permissions, $map);

  // split up the permission groups
  $parts = str_split($permissions, 3);

  // convert the groups
  $mapper = function ($part) {
    return array_sum(str_split($part));
  };

  // converts to decimal number
  return octdec(implode('', array_map($mapper, $parts)));*/
  }

  /**
   * Filter out dot-directories.
   *
   * @param {array} list
   *
   * @return array
   */
  public removeDotDirectories(list: any[]) {
    /*$filter = function ($line) {
    return $line !== '' && ! preg_match('#.* \.(\.)?$|^total#', $line);
  };

  return array_filter($list, $filter);*/
  }

  /**
   * @inheritdoc
   */
  public async has(path: string) {
    const result = await this.client.send(`RSTATUS ${path}`);
    return true;
    //this.client.lastMod(path);
    // return $this->getMetadata($path);
  }

  /**
   * @inheritdoc
   */
  public getSize(path: string) {
    // return $this->getMetadata($path);
  }

  /**
   * @inheritdoc
   */
  public getVisibility(path: string) {
    // return $this->getMetadata($path);
  }

  /**
   * Ensure a directory exists.
   *
   * @param {string} dirname
   */
  public ensureDirectory(dirname: string) {
    /*$dirname = (string) $dirname;

  if ($dirname !== '' && ! $this->has($dirname)) {
  $this->createDir($dirname, new Config());
}*/
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
