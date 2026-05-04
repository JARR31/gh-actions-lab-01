import os, sys, json

CHANGED = '''
{
  "api": "true",
  "web": "false",
  "domain": "true",
  "cicd": "false"
}
'''

for area, changed in json.loads(CHANGED).items():
    if changed == 'true':
        print("area:{}".format(area))
