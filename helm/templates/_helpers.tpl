{{- define "geoserver.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- $fullname := default (printf "%s-%s" .Release.Name $name) .Values.fullnameOverride -}}
{{- printf "%s" $fullname | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "geoserver.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "geoserver.image" -}}
{{- $registryName := .Values.image.registry -}}
{{- $repositoryName := .Values.image.geoserverRepository -}}
{{- $tag := .Values.image.geoserverTag | toString -}}
{{- printf "%s/%s:%s" $registryName $repositoryName $tag -}}
{{- end -}}

{{- define "geoserver.sidecarImage" -}}
{{- $registryName := .Values.image.registry -}}
{{- $repositoryName := .Values.image.sidecarRepository -}}
{{- $tag := .Values.image.sidecarTag | toString -}}
{{- printf "%s/%s:%s" $registryName $repositoryName $tag -}}
{{- end -}}

{{/*
Get the password secret.
*/}}
{{- define "geoserver.secretName" -}}
{{- printf "%s" (include "geoserver.fullname" .) -}}
{{- end -}}