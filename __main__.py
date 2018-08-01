#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: github.com/merlinND
# Forked from: github.com/tintinweb

from __future__ import print_function
import argparse
import os
import sys
import time
from trello_maths import ElectronRemoteDebugger
import logging

logger = logging.getLogger(__name__)
DEFAULT_SCRIPT_FILE = os.path.join(os.path.dirname(os.path.realpath(__file__)), "script.js")

def main():
    """Launches the requested Electron-based app with remote debugging support
    enabled. Optionally injects JavaScript using the remote debugger."""

    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)-8s - %(message)s')

    # Parse program arguments.
    parser = argparse.ArgumentParser(prog='trello_maths',
                                     usage='%(prog)s /path/to/electron/powered/application')
    parser.add_argument("--script_file", type=str, default=DEFAULT_SCRIPT_FILE,
                        help="JavaScript file to inject into the app (e.g. to setup hotkeys).")
    parser.add_argument("--timeout", type=int, default=5,
                        help="Try hard to inject for the time specified [default: 5s]")
    parser.add_argument("target", type=str, nargs='?',
                        default="/Applications/Trello.app/Contents/MacOS/Trello",
                        help="Path to the Electron-powered application to inject.")
    parser.add_argument("application_args", type=str, nargs='*',
                        default=[],
                        help="Extra arguments to be passed to the application.")
    args = parser.parse_args()
    args.timeout = time.time() + int(args.timeout) if args.timeout else 0

    target = ' '.join([args.target] + args.application_args).strip()
    logger.info("Target: {}".format(target))

    erb = ElectronRemoteDebugger.execute(target)

    windows_visited = set()
    script_to_inject = None
    if args.script_file:
        with open(args.script_file, 'r') as f:
            script_to_inject = f.read()
        logger.info("Script is:\n{}".format(script_to_inject))

        while True:
            for w in erb.windows():
                if w['id'] in windows_visited:
                    continue
                logger.info("Injecting script {} into window {}".format(args.script_file, w['id']))
                res = erb.eval(w, script_to_inject)
                logger.debug("Result from window injection: {}".format(res))
                # Patch windows only once
                windows_visited.add(w['id'])

            if time.time() > args.timeout:
                logger.warn("Timeout hit.")
                break
            time.sleep(1)


if __name__ == '__main__':
    main()
