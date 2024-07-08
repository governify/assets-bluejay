# Create or update class TPA

## Description
This script allows you to create all agreements for a project that has not yet been created, or update agreements for a set of projects.

## Configuration Variables

- `template`: A string representing the TPA template to use. This template must be stored in the assets-manager, within public/renders/tpa. The string will be the name of the file without including the .json ending.
- `mode`: A string representing replace or create, depending on whether we want to replace a TPA for an already created project or create a TPA for an uncreated project.
- `agreementId`: A string representing the projectId of the project that you want to update or create. In case of replacement, a regexp is used and all projects that comply with the chain will be updated with the new TPA. In case of creating, the specific projectId of the project must be entered.
- `classId`: Only used in create. A string representing the classId of the class to which the project we want to create belongs.

## Configuration Default

### Replace
```json
{
  "template": "template",
  "mode": "replace",
  "agreementId": "showcase"
}
```

### Create
```json
{
  "template": "template",
  "mode": "create",
  "agreementId": "showcase-GH-governify_bluejay-showcase",
  "classId": "showcase"
}
```