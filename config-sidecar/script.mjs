#!/usr/bin/env zx
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as stream from 'stream';
import { once } from 'events';
import * as util from 'util';
import { join } from 'path';
import yargs from 'yargs';
import jsLogger from '@map-colonies/js-logger';

const DATA_FILE = 'data.tar.gz';
const REGION = 'us-east-1';

const args = yargs(process.argv.slice(3))
  .env()
  .usage('Usage: $0 script.mjs [options]')
  .option('is-init-mode', { alias: 'i', describe: 'Is init mode flag', nargs: 1, boolean: true, default: true })
  .option('s3-endpoint-url', { alias: 'e', describe: 'The object storage endpoint', nargs: 1, string: true, demandOption: true })
  .option('s3-bucket-name', { alias: 'b', describe: 'The bucket name containing all the keys', nargs: 1, string: true, demandOption: true })
  .option('s3-data-key', { alias: 'd', describe: 'The key for the data dir tar', nargs: 1, string: true, demandOption: true })
  .option('s3-state-key', { alias: 's', describe: 'The key for the config state object', nargs: 1, string: true, demandOption: true })
  .option('geoserver-user', { alias: 'U', describe: 'The geoserver user to authenticate with', nargs: 1, string: true })
  .option('geoserver-pass', { alias: 'P', describe: 'The geoserver password for the user to authenticate with', nargs: 1, string: true })
  .option('geoserver-url', {
    alias: 'u',
    describe: 'the url to the reload endpoint on geoserver',
    default: 'http://localhost:8080/geoserver/rest/reload',
    nargs: 1,
    string: true,
  })
  .option('data-dir-path', { alias: 'D', describe: 'The path to the data dir', nargs: 1, string: true, demandOption: true })
  .option('update-interval', {
    alias: 'I',
    describe: 'The interval between configuration reload in milliseconds',
    nargs: 1,
    number: true,
    default: 120000,
  })
  .option('wait-on-startup', { alias: 'w', describe: 'The time to wait before starting in milliseconds', nargs: 1, number: true, default: 30000 })
  .option('zx-shell', { alias: 'z', describe: 'The shell used by zx', nargs: 1, default: '/bin/bash' })
  .option('log-level', { alias: 'l', describe: 'The log level', choices: ['debug', 'info', 'warn', 'error', 'fatal'], default: 'info' })
  .help('h')
  .alias('h', 'help').argv;

const logger = jsLogger.default({ level: args.logLevel });

$.shell = args.zxShell;
$.verbose = false;

const currentStateFile = join(args.dataDirPath, 'state');

const finished = util.promisify(stream.finished);

const streamToString = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

const streamToFile = async (stream, path) => {
  const file = fs.createWriteStream(path);

  for await (const chunk of stream) {
    if (!file.write(chunk)) {
      await once(file, 'drain');
    }
  }

  file.end();

  await finished(file);
};

const s3Client = new S3Client({
  signatureVersion: 'v4',
  endpoint: args.s3EndpointUrl,
  forcePathStyle: true,
  region: REGION,
});

const updateConfiguration = async () => {
  try {
    logger.debug({ msg: 'getting state from storage', bucket: args.s3BucketName, key: args.s3StateKey });

    const remoteStateStream = await s3Client.send(new GetObjectCommand({ Bucket: args.s3BucketName, Key: args.s3StateKey }));
    const remoteState = await streamToString(remoteStateStream.Body);

    if (!args.isInitMode && remoteState == (await $`cat ${currentStateFile}`)) {
      logger.info({ msg: 'state unchanged' });
      return;
    }

    logger.debug({ msg: 'getting data from storage', bucket: args.s3BucketName, key: args.s3DataKey });

    const datadirStream = await s3Client.send(new GetObjectCommand({ Bucket: args.s3BucketName, Key: args.s3DataKey }));

    await streamToFile(datadirStream.Body, DATA_FILE);

    logger.info({ msg: 'unpacking the data dir' });

    await $`tar -zxf ${DATA_FILE}`;

    await $`rsync -a --delete data_dir/* ${args.dataDirPath}`;

    await $`rm -rf ${DATA_FILE} && rm -rf data_dir/*`;

    if (!args.isInitMode) {
      logger.info({ msg: 'sending config reload request to geoserver' });

      const response = await fetch(args.geoserverUrl, {
        method: 'post',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${args.geoserverUser}:${args.geoserverPass}`).toString('base64'),
        },
      });

      if (!response.ok) {
        logger.error({ msg: 'reloading geoserver configuration failed', err: response.statusText });
        process.exit(1);
      }
    }

    await fs.writeFile(currentStateFile, remoteState);
    logger.info({ msg: 'state updated', updatedState: remoteState });
  } catch (err) {
    logger.error({ msg: 'an error occurred while updating configuration', err });

    if (args.isInitMode) {
      process.exit(1);
    }
  }
};

if (args.isInitMode) {
  await updateConfiguration();
  logger.info({ msg: 'finished updating, exiting gracefully' });
} else {
  // wait for geoserver to be ready
  await sleep(args.waitOnStartup);

  while (true) {
    await updateConfiguration();

    logger.debug({ msg: 'sleeping for update interval', interval: args.updateInterval });

    await sleep(args.updateInterval);
  }
}
