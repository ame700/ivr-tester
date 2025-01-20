# Genesys Cloud Client Logger
Logger to send client logs to a remote server.

See [CHANGELOG.md](CHANGELOG.md) for version updates.

### Install

Using a package manager:
``` sh
npm install genesys-cloud-client-logger
# Or via yarn
yarn add genesys-cloud-client-logger
```

Or directly from the CDN:
``` html
<!-- specify desired major version to receive minor and patch version updates -->
<script src="https://apps.mypurecloud.com/genesys-cloud-client-logger/v4/genesys-cloud-client-logger.min.js"></script>

<!-- OR, specify an exact version -->
<script src="https://apps.mypurecloud.com/genesys-cloud-client-logger/v4.0.1/genesys-cloud-client-logger.min.js"></script>
```

> Note: the **major** and **exact** versions were added in `v4.0.2`. The version hosted at `.../genesys-cloud-client-logger/genesys-cloud-client-logger.min.js`
> will always remain as `v4.0.1` to avoid breaking changes. However, it is strongly recommended that you upgrade to use a major version URL.

### Basic Concept
Each Logger instance will have it's own configuration meaning you can have multiple apps using their own individual loggers. One thing to note is the loggers
will share a "log-uploader" for each given `url`. For example, if `app1` and `app2` both POST logs to the same endpoint, they will have their own logger and
config, but will share the same uploader. Meaning only one POST request will happen at a time. This is to help reduce rate limiting by having multiple loggers
all sending POST requests to the same endpoint at the same time.


### Usage
``` ts
import { Logger } from 'genesys-cloud-client-logger';

const logger = new Logger({
  url: 'https://yoursite.com/logs',
  accessToken: 'your-access-token',
  appVersion: '1.2.3',
  appName: 'your-client-app1'
});

logger.info('Logger initialized');
```

Available options and their defaults:

``` ts
interface ILoggerConfig {
  /**
   * JWT access token to use in HTTP request
   */
  accessToken: string;
  /**
   * url to send the logs to (note this needs to be the full URL)
   * an HTTP `POST` request will be issued to this url
   */
  url: string;
  /**
   * the version of app using the logging library.
   */
  appVersion: string;
  /**
   * All local logs will be prefixed by this.
   * This is the app name of the app using the logger
   * Could also be thought of as the `appName`.
   */
  appName: string;
  /**
   * This name is used when the app who is using the logger
   *  (ie. the `logTopic` app) is being imported/used/consumed
   *  by another app. Another way to think about this would
   *  be `originAppName` is who this app's logger is logging
   *  "on behalf of" or the "parent app of".
   */
  originAppName?: string;
  /**
   * This version is used when the app who is using the logger
   *  (ie. the `logTopic` app) is being imported/used/consumed
   *  by another app. Another way to think about this would
   *  be `originAppName` is who this app's logger is logging
   *  "on behalf of" or the "parent app of".
   *
   * NOTE: this is only used if `originAppName` is provided
   */
  originAppVersion?: string;
  /**
   * This should be the `clientId` of the parent app's logger.
   *  It is used to correlate the parent app to this child app.
   *
   * NOTE: this is only used if `originAppName` is provided
   */
  originAppId?: string;
  /**
   * initialize server logging. defaults to `true`
   */
  initializeServerLogging?: boolean;
  /**
   * If set to true, logs will not start sending to the server
   * until `logger.startServerLogging()` is called.
   *
   * This will have no effect if `initializeServerLogging = false`.
   */
  startServerLoggingPaused?: boolean;
  /**
   * logs at this level or high get sent to the server. defaults to 'info'
   */
  logLevel?: LogLevel;
  /**
   * time to debounce logs uploads to the server. defaults to 4000
   */
  uploadDebounceTime?: number;
  /**
   * debug logger events. defaults to `false`
   */
  debugMode?: boolean;
  /**
   * stringify log details when writing to console. defaults to `false`
   */
  stringify?: boolean;
  /**
   * Optional extra logger to use instead of the console.
   * Default: console
   * NOTE: unless `initializeServerLogging = false`, logs
   * will also attempt to upload to the server, even if an
   * additional logger is passed in. This logger will be used
   * in place of the console, but still alongside this logger.
   */
  logger?: ILogger;
  /**
   * These are essentially interceptors for log messages. They will allow
   * you to change the level, message, details or log options for any given
   * message. There are three options for handling messages:
   *   next() - sends message as it was received to the next formatter
   *   next(level, message, details, options) - sends message to the next formatter with the specified params
   *   not calling next() at all - don't log the message
   */
  formatters?: LogFormatterFn[]
}
```

### Logging messages
``` ts
log (message: string | Error, details?: any, opts?: ILogMessageOptions): void;

interface ILogMessageOptions {
  skipDefaultFormatter?: boolean,
  skipServer?: boolean,
  skipSecondaryLogger?: boolean,
}
```
The default formatter handles extracting the message from an error object as well as prepending the app name to the
message that will be logged. For example, if your app name is "really cool app" and you do something like this:
``` ts
logger.info('some message I care about', { favoriteColor: 'blue' });
```
It will be logged like this:
```
[really cool app] some message I care about {...}
```
If you were to log a message like this:
```ts
logger.info('some message I care about', { favoriteColor: 'blue' }, { skipDefaultFormatter: true });
```
It would be logged without the app name:
```
some message I care about {...}
```


### How Formatters Work
Formatters are a great tool to handle unique logging situations. For example, let's say
you have an error that has the potential to expose or send information that is unfit to
be exposed. In a formatter, you can choose to manipulate the message or details, do
nothing, or skip logging the message entirely. A formatter will be provided a `next`
function in addition to the log message. If next is not called, the log will not be forwarded
to downstream formatters and will not make it to the actual logger. Example:

``` ts
function myCustomFormatter (
  level: LogLevel,
  message: string | Error,
  details: any | undefined,
  options: ILogMessageOptions,
  next: NextFn
) {
  // we want to only log this to the secondary logger (usually the console) and not send this
  // specific log to the server
  if (message.includes('[confidential]')) {
    options.skipServer = true;
    return next(level, 'this message is confidential and redacted', details, options);
  }

  // we want to completely silence these messages
  if (message.includes('[top secret]')) {
    return;
  }

  // this formatter doesn't want to do anything special with this log, send it to the next formatter
  next();
}

const logger = new Logger({
  url: 'https://yoursite.com/logs',
  accessToken: 'your-access-token',
  appVersion: '1.2.3',
  appName: 'your-client-app1',
  formatters: [ myCustomFormatter ]
});

logger.info('here is a message');
// will log a message like this to the server and secondaryLogger (console)
// [your-client-app1] here is a message

logger.info('here is a [confidential] message');
// will log a message like secondaryLogger (console) but not the console
// [your-client-app1] this message is confidential and redacted

logger.info('here is a [top secret] message');
// nothing will be sent to either logger
```

### Pausing Server Logs
In version 4.1.0, "pausing" server logs was introduced. This is useful in a few of the following scenarios (not an exhaustive list):

1. `POST`ing logs to an endpoint returns a `401` or `404` status code.
1. The consuming apps wants to be able to stop sending logs for a given period of time
    and then start sending again.
1. The consuming app wishes to construct a logger instance with server logging paused,
    and then start sending logs further in the future.

The declaration of the available functions are:

``` ts
class Logger {
  /**
   * Start sending logs to the server. Only applies if
   * the logger instance was configured with server logging.
   * @returns void
   */
  startServerLogging (): void;
  /**
   * Stop sending logs to the server. Note; this will clear
   * any items that are currently in the buffer. If you wish
   * to send any currently pending log items, use
   * `sendAllLogsInstantly()` before stopping the server loggin.
   *
   * @param reason optional; default `'force'`
   * @returns void
   */
  stopServerLogging (): void;
  /**
   * Force send all pending log items to the server.
   *
   * @returns an array of HTTP request promises
   */
  sendAllLogsInstantly (): Promise<any>[];
  // ...
}
```

And **available events**:
``` ts
/**
 * any errors catch inside the logger. usually, these will be
 * HTTP errors
 */
logger.on('onError', (error: any) => { });

/**
 * Fired when server logging starts again
 *
 * NOTE: this will not fire on construction
 *  if `initializeServerLogger === true`
 */
logger.on('onStart', () => { });

/**
 * Fired when server logging is stopped.
 *
 * If `stopServerLogging()` was called,
 *  the value will be `'force'`.
 */
logger.on('onStop', (reason: StopReason) => { });

/* list of available reasons: `'force'` is default */
type StopReason = '401' | '404' | 'force';
```

You can also leverage the config option `startServerLoggingPaused` (see above).

A few notes:
1. `stopServerLogging()` does a few things:
    * it will _no longer_ queue up requests. In other words: it will not "retroactively"
        send logs to the server while it was paused.
    * it will clear out any queued up log items – meaning: any pending logs will be
        dropped on the floor. If you want to send any pending items, call
        `sendAllLogsInstantly()` before stopping the server logging.
1. If the logger receives a `404`, it will automatically stop sending server logs.
1. If the logger receives a `401`, it will automatically stop sending server logs. However,
    once `setAccessToken()` is called, it will start sending logs again.
    * NOTE: if `stopServerLogging()` was called, `setAccessToken()` will _NOT_
      automatically start sending logs again. It will only start sending logs again if the
      `401` was the last event received inside the logger.