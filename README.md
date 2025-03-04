# Oracle VM Security List whitelist runner

This action is to automate whitelisting of security list of private VM's
temporarily for GitHub action runners. This is more like a connector which
allows deployment of builds if you are using a VM to deploy your applications.

### NOTE: This is not intended to be used in production. This is something I wrote for my custom needs since I usually deploy to VM

## Inputs

### `security-list-id`

**Required** The id (OCID) of the security list which needed to be modified

### `hold-interval`

**Optional** If the address is already added for the provided target port. The
runner will till the provided time to get a free slot. Hold interval is
basically how long it should wait till it needs to check again.

`Default`: 5

### `hold-count`

**Optional** If the address is already added for the provided target port. The
runner will till the provided time to get a free slot. Hold count will tell how
much time it should wait for hold interval

**If hold-interval is 5 and hold-count is 10, it will wait for 5 \* 10 sec and
each 5 sec it will check whether the address if free or not**

`Default`: 12

### `target-port`

**Optional** The target port to be opened

`Default`: 22

### `silent`

**Optional** Whether log should be printed, This will print the more things
`Default`: false

## Outputs

## Example usage

```yaml
uses: AlenGeoAlex/oracle-vm-runner-security-list-action@main
with:
  'security-list-id': ''
```
