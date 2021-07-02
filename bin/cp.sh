#!/bin/bash

find output -maxdepth 1 -type f | sort -n | head -$1 | xargs -I curd cp curd $2
