import os, re, sys

SECTIONS = [
    "## Problem Statement",
    "## Test Evidence",
    "## Rollback Notes",
]

PR_BODY = (os.getenv("PR_BODY") or "").strip()

if PR_BODY == "":
	print("The PR Body is empty.")
	sys.exit(1)

body_list = PR_BODY.splitlines()
errors = ""

for section in SECTIONS:
    if section not in body_list:
        errors += "- Missing \"{}\" in PR Body.\n".format(section)

if len(errors) == 0:
    print("PR Body Validation Passed.")
    sys.exit(0)

print("PR Body Validation Failed:\n{}".format(errors))
sys.exit(1)