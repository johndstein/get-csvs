# Get CSVs

Makes HTTPS GET requests to multiple URLs containing CSVs of the same structure
and stacks them up into a single output stream.

The problem we are solving here is that both request
https://github.com/request/request and axios https://github.com/axios/axios fail
to work correctly when appending multiple streams together. They both work in
most cases, but the final stream is corrupted in other cases. So we ended up
using the bare node https module. So far it hasn't failed.

We assume each CSV stream starts with a header row, and we remove all but the
first header row from the final output stream. This behavior can be overridden.

We currently only support HTTPS.

## Install

```sh
npm i get-csvs
```

## Enjoy

```js
const options = {
  urls: [
    'https://mysite.com/some.csv',
    'https://mysite.com/more-some.csv',
    'https://mysite.com/even-more-some.csv'
  ]};

require('get-csvs')(options, (error, stream) => {
  if (error) {
    console.error(error);
    process.exit(13);
  }
  stream.pipe(process.stdout);
});
```

**Options**

```
urls:       An array of URLs.

https:      Options for the https.get(options[, callback]) method.
            https://nodejs.org/api/https.html#https_https_get_options_callback

skipRows:   An array of regex patterns denoting lines we will remove from
            the CSV file.

noHeaders:  If true, we expect each CSV stream has NO header as the first
            row, so we just stack up the streams as they are. If false, we
            assume each CSV stream starts with a header row. We will remove
            the header row from all but the first stream.
```

## TODO

Look into https://github.com/mafintosh/pump or
https://github.com/mafintosh/pumpify to make sure error handling and cleanup is
proper on the streams.

See also https://nodejs.org/en/docs/guides/backpressuring-in-streams
