#!/usr/bin/env python3

"""This class implements a monitoring thread that can be used to collect technical
   support information in case of problems with the portal."""

__copyright__ = 'Copyright (c) 2021-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import os
import socket
import sys
import traceback
from datetime import datetime
from io import StringIO
from threading import Timer
from typing import Any, Dict

import flask
import humanize
import psutil


class Monitor(Timer):

    def __init__(self, config: flask.config.Config, monitor_data: Dict[int, Dict[str, Any]]):
        self.interval = 1
        self.config = config
        self.monitor_data = monitor_data
        Timer.__init__(self, self.interval, self.record_info_if_needed)

    def get_signal_file(self) -> str:
        return self.config.get("MONITOR_SIGNAL_FILE", "/var/www/yoda/show-tech.sig")

    def get_output_dir(self) -> str:
        return self.config.get("MONITOR_OUTPUT_DIR", "/tmp")

    def get_yoda_version(self) -> str:
        return "{} ({})".format(self.config.get("YODA_VERSION", "N/A"),
                                self.config.get("YODA_COMMIT", "N/A"))

    def record_info_if_needed(self) -> None:
        while not self.finished.wait(self.interval):
            try:
                if os.path.isfile(self.get_signal_file()):
                    output_file = os.path.join(self.get_output_dir(),
                                               datetime.now().strftime("yoda-portal-showtech-%d-%m-%Y-%H-%M-%S-%f.txt"))
                    with open(output_file, "w") as output:
                        tshoot_info = self.get_tshoot_info()
                        output.write(tshoot_info.getvalue())
            except Exception as e:
                print("Exception occurred in monitoring thread: {} ({})".format(str(e), str(type(e))))

    def get_tshoot_info(self) -> StringIO:
        output = StringIO()
        date_string = datetime.now().strftime("%d/%m/%Y at %H:%M:%S.%f")
        hostname = socket.getfqdn()
        yoda_version = self.get_yoda_version()
        output.write(f"Portal tech support info for {hostname}, collected on {date_string}\n")
        output.write(f"Yoda version, as per portal config: {yoda_version}\n\n")

        cpu_percent = str(psutil.cpu_percent()) + "%"
        mem_total = humanize.naturalsize(psutil.virtual_memory().total)
        mem_available = humanize.naturalsize(psutil.virtual_memory().available)
        mem_buffers = humanize.naturalsize(psutil.virtual_memory().buffers)
        mem_cached = humanize.naturalsize(psutil.virtual_memory().cached)
        mem_info = psutil.Process().memory_info()
        mem_rss = humanize.naturalsize(mem_info.rss)
        mem_vms = humanize.naturalsize(mem_info.vms)
        mem_shared = humanize.naturalsize(mem_info.shared)
        output.write(f"System-wide CPU percent:         {cpu_percent}\n")
        output.write(f"Memory: global total:            {mem_total}\n")
        output.write(f"Memory: global available:        {mem_available}\n")
        output.write(f"Memory: global buffers:          {mem_buffers}\n")
        output.write(f"Memory: global cached:           {mem_cached}\n")
        output.write(f"Memory: process RSS:             {mem_rss}\n")
        output.write(f"Memory: process VMS:             {mem_vms}\n")
        output.write(f"Memory: process shared:          {mem_shared}\n")

        output.write("\n")

        for thread_id, stack in sys._current_frames().items():
            output.write(f"Thread ID: {thread_id}\n")

            thread_monitor_data = self.monitor_data.get(thread_id, {})
            for monitor_variable in thread_monitor_data:
                monitor_value = str(thread_monitor_data.get(monitor_variable))
                output.write(f"{monitor_variable}: {monitor_value}\n")

            output.write("Traceback:\n")
            for filename, line_number, function_name, line in traceback.extract_stack(stack):
                output.write(f"  {filename}:{line_number} [{function_name}]\n")
                output.write(f"     {line}\n" if line else "")
            output.write("\n")

        return output
