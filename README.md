# geoserver-datadir-sync
This repo contains a helm chart to deploy geoserver with reloading configuration to opeshift.

## Why
Geoserver by nature is a monolithic project that is built to run on VM or a physical machine.
Because we want it to run on k8s, we added a sidecar that enables geoserver to be deployed to k8s without a persistent volume.

## How does it work
When a new geoserver pod is starting, an init-container that runs the image will download the datadir from S3 for the first time, so geoserver has an initial configuration.
After the init container has finished it job, the geoserver image will start, and a sidecar that will check periodically for changes in S3, and if it detects one, it will download the new one, and apply it to the Geoserver image.


## Installation

set the values as you please, and run:
```bash
  cd helm
  helm install geoserver .
```
