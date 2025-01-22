# Request TPA Report

## Description
This script can be executed by the Director service to request a report from a Teams Practice Agreement (TPA) for a specific period. The script will call generate the following calls:
Requests:

- Director -> Reporter -> Registry -> Collector

Responses:

- Collector -> Registry; Collector gets the info and Registry store evidences.
- Registry -> Reporter; Reporter generates the report (points in influxdb later visualized in Grafana)

### Warning
Moustache is needed to run this script.

This script is used by TPA-Manager to generate the report schedules in the Director service. It sends a request to the Director service with a new task, which includes this script and the configuration provided by the Scopes Manager (init, end, interval).

## Configuration Variables

- `agreementId`: A string representing the ID of the agreement for which points need to be created.
- `periods`: An optional array of objects representing the periods for which points need to be created. Each object should have `from` and `to` properties in ISO format. **If not provided, the script will use the last hour as the default period.**

## Configuration Default

```json
{
    "agreementId": "example-agreement-id",
    "periods": [
        {
            "from": "2023-10-01T10:00:00.000Z",
            "to": "2023-10-01T11:00:00.000Z"
        }
    ]
}
```