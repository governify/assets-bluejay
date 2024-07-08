# Optimize Calculation Period

## Description
When automatic calculations are activated, a large number of calculations occurring simultaneously can overwhelm the system. This script addresses this issue by distributing the execution times. 

Director microservice has .json files with the tasks info. This script changes those files contents.

## Configuration Variables

- `filenameMustIncludeAll`: An array of strings representing substrings that must be included in the filenames of the director tasks. Used to only modify relevant files, for exaple all files with a course name.
- `startingTime`: A string representing the starting time in 24-hour format (HH:mm).
- `endingTime`: A string representing the ending time in 24-hour format (HH:mm).
- `batchSize`: An integer representing the number of groups that can be activated at the same hour.

## Configuration Default

```json
{
    "filenameMustIncludeAll": [
        "tpa-",
        "class01"
    ],
    "startingTime": "10:10",
    "endingTime": "10:14",
    "batchSize": 1
}
```