# Optimize calculation period
## Description
When automatic calculations are activates, a big number of calculations at the same time
can break the sistem. This script separates the times of execution.

## Configuration variables
<pre>
courseRegex: string. Course name. Used to look for activated automatic calculations
maxMinutesDelay: int. Time in minutes to distribute equally all groups inside
batchSize: int. Numbers of groups that can be activated at the same hour 
</pre>

## Configuration default
```
{
    "courseRegex": "class01",
    "maxMinutesDelay": 60,
    "batchSize": 2
}
```
