# config-sidecar

This is a sidecar container to reload Geoserver configuration from s3.


## Usage

```
Usage: zx script.mjs [options]

Options:
      --version          Show version number                           [boolean]
  -i, --is-init-mode     Is init mode flag             [boolean] [default: true]
  -e, --s3-endpoint-url  The object storage endpoint         [string] [required]
  -b, --s3-bucket-name   The bucket name containing all the keys
                                                             [string] [required]
  -d, --s3-data-key      The key for the data dir tar        [string] [required]
  -s, --s3-state-key     The key for the config state object [string] [required]
  -U, --geoserver-user   The geoserver user to authenticate with        [string]
  -P, --geoserver-pass   The geoserver password for the user to authenticate wit
                         h                                              [string]
  -u, --geoserver-url    the url to the reload endpoint on geoserver
               [string] [default: "http://localhost:8080/geoserver/rest/reload"]
  -D, --data-dir-path    The path to the data dir            [string] [required]
  -I, --update-interval  The interval between configuration reload in millisecon
                         ds                           [number] [default: 120000]
  -w, --wait-on-startup  The time to wait before starting in milliseconds
                                                       [number] [default: 30000]
  -z, --zx-shell         The shell used by zx             [default: "/bin/bash"]
  -l, --log-level        The log level
          [choices: "debug", "info", "warn", "error", "fatal"] [default: "info"]
  -h, --help             Show help                                     [boolean]
```


## Environment Variables

Any option that can be set using the cli command line, can be also set by writing its value in `SNAKE_CASE`.

For example, the option `--s3-bucket-name` can be set by using the `S3_BUCKET_NAME` environment variables.


## Setting AWS SDK authentication

In order to authenticate to Object storage, you need to supply the AWS credentials.

The easiest way to do this is to define the following env varaibles:

`AWS_ACCESS_KEY_ID`

`AWS_SECRET_ACCESS_KEY`
