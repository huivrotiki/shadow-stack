#!/bin/bash
# hd-auto.sh — Auto-generate HD reports at session end

./scripts/hd-generate.sh hd
./scripts/hd-generate.sh hd+
git add autosaves-and-commits/
git commit -m "chore(hd): auto-generate session reports $(date)"
