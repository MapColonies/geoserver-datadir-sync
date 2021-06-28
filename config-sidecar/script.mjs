#!/usr/bin/env zx
$.verbose = true;
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as stream from 'stream';
import { once } from 'events';
import * as util from 'util';

const CURRENT_STATE_FILE = 'state';
const DATA_FILE = 'data';
const REGION = 'us-east-1';

const {
  ZX_SHELL,
  S3_DATA_KEY,
  S3_STATE_KEY,
  GEOSERVER_USER,
  GEOSERVER_PASS,
  GEOSERVER_URL,
  S3_ENDPOINT_URL,
  S3_BUCKET_NAME,
  DATA_DIR_PATH,
  UPDATE_INTERVAL,
  IS_INIT_MODE,
} = process.env;

$.shell = ZX_SHELL ?? '/usr/bin/bash'

const isInitMode = IS_INIT_MODE === 'true';
const updateInterval = UPDATE_INTERVAL ? parseInt(UPDATE_INTERVAL) : 120000;

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
  endpoint: S3_ENDPOINT_URL,
  forcePathStyle: true,
  region: REGION,
});

const updateConfiguration = async () => {
  const remoteStateStream = await s3Client.send(
    new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: S3_STATE_KEY })
  );
  const remoteState = await streamToString(remoteStateStream.Body);

  if (!isInitMode && remoteState == (await $`cat ${CURRENT_STATE_FILE}`)) {
    console.log('state unchanged');
    return;
  }

  const datadirStream = await s3Client.send(
    new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: S3_DATA_KEY })
  );

  await streamToFile(datadirStream.Body, DATA_FILE);
  await $`tar -zxvf ${DATA_FILE}`;

  if (isInitMode) {
    return;
  }

  await $`rm -rf ${DATA_FILE}`;

  await $`cp -r data_dir/* ${DATA_DIR_PATH}`;

  await $`rm -rf data_dir/*`

  await fetch(GEOSERVER_URL, {
    method: 'post',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(`${GEOSERVER_USER}:${GEOSERVER_PASS}`).toString('base64'),
    },
  });

  await fs.writeFile(CURRENT_STATE_FILE, remoteState);
};

await updateConfiguration();

while (!isInitMode) {
  await updateConfiguration();
  await sleep(updateInterval);
}
