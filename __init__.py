#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: github.com/merlinND
# Forked from: github.com/tintinweb

from __future__ import print_function

import asyncio
import json
import logging
import requests
import socket
import subprocess
import time
import time
import websocket

logger = logging.getLogger(__name__)

class LazyWebsocket(object):
    def __init__(self, url):
        self.url = url
        self.ws = None

    def _connect(self):
        if not self.ws:
            self.ws = websocket.create_connection(self.url)
        return self.ws

    def send(self, *args, **kwargs):
        return self._connect().send(*args, **kwargs)

    def recv(self, *args, **kwargs):
        return self.ws.recv(*args, **kwargs)

    def sendrcv(self, msg):
        self.send(msg)
        return self.recv()

    def close(self):
        self.ws.close()

    def __str__(self):
        return "LazyWebsocket[url={}, ws={}]".format(self.url, self.ws)


class ElectronRemoteDebugger(object):
    def __init__(self, host, port):
        self.params = {'host': host, 'port': port}

    def windows(self):
        params = self.params.copy()
        params.update({'ts': int(time.time())})

        ret = []
        for w in self.requests_get("http://%(host)s:%(port)s/json/list?t=%(ts)d" % params).json():
            url = w.get("webSocketDebuggerUrl")
            if not url:
                continue
            print("Got websocket URL: {}".format(url))
            w['ws'] = LazyWebsocket(url)
            ret.append(w)
        return ret

    def requests_get(self, url, tries=5, delay=1):
        last_exception = None
        for _ in range(tries):
            try:
                return requests.get(url)
            except requests.exceptions.ConnectionError as ce:
                # ignore it
                last_exception = ce
            time.sleep(delay)
        if last_exception:
            raise last_exception


    def eval(self, w, expression):
        data = {'id': 1,
                'method': "Runtime.evaluate",
                'params': {'contextId': 1,
                           'doNotPauseOnExceptionsAndMuteConsole': False,
                           'expression': expression,
                           'gneratePreview': False,
                           'includeCommandLineAPI': True,
                           'objectGroup': 'console',
                           'returnByValue': False,
                           'userGesture': True}}

        ret = json.loads(w['ws'].sendrcv(json.dumps(data)))
        print(ret)
        if "result" not in ret:
            return ret
        if 'wasThrown' in ret['result']:
            raise Exception(ret['result']['result'])
        return ret['result']

    @classmethod
    def execute(cls, path):
        # Get a free port number on which to run the remote debugger.
        port = 56955
        # sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # sock.bind(('', 0))
        # port = sock.getsockname()[1]
        # sock.close()

        cmd = "%s %s" % (path, "--remote-debugging-port=%d" % port)
        logger.debug(cmd)
        p = subprocess.Popen(cmd, shell=True)

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        for _ in range(30):
            result = sock.connect_ex(('localhost', port))
            if result > 0:
                break
            time.sleep(1)
        return cls("localhost", port=port)


if __name__ == "__main__":
    with open('script.js', 'r') as f:
        script_to_inject = f.read()

    erb = ElectronRemoteDebugger("localhost", 8888)
    for w in erb.windows():
        logger.debug(erb.eval(w, script_to_inject))
