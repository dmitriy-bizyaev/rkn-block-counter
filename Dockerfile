FROM alpine:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app

RUN apk add -U nodejs \
    && npm install --production \
    && npm dedupe \
    && npm rm -g npm \
    && rm /var/cache/apk/* \
    && rm -rf /tmp/* \
    && rm -rf /root/..?* /root/.[!.]* /root/*

EXPOSE 80
ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
