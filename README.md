# geoserver-datadir-sync
This repo contains a helm chart to deploy geoserver with reloading configuration to opeshift.

## Why
Geoserver by nature is a monolithic project that is built to run on VM or a physical machine.
Because we want it to run on k8s, we added a sidecar that enables geoserver to be deployed to k8s without a persistent volume.

## How does it work
When a new geoserver pod is starting, an init-container that runs the image will download the datadir from S3 for the first time, so geoserver has an initial configuration.
After the init container has finished it job, the geoserver image will start, and a sidecar that will check periodically for changes in S3, and if it detects one, it will download the new one, and apply it to the Geoserver image.

## Logging
- for custom geoserver logging define your logging schema and place it in `/data_dir/logs/custom_logging.xml` it is possible to log in json format using the `JsonTemplateLayout` [read more](https://logging.apache.org/log4j/2.x/manual/json-template-layout.html)

- you can set the used logging schema through the geoserver UI under Global-Settings -> Logging Profile or specify it in `/data_dir/logging.xml`

- in the UI you can also define your wanted requests logging strategy


## Installation
set the values as you please, and run:
```bash
  cd helm
  helm install geoserver .
```
