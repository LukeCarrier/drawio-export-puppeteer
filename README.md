# Draw.io exports via Puppeteer

Node module for exporting Draw.io diagrams to a range of formats using Puppeteer, designed as a drop-in replacement for the Draw.io desktop CLI.

---

## Hacking

We use [`asdf-vm`](https://asdf-vm.com/) with the [`nodejs`](https://github.com/asdf-vm/asdf-nodejs) plugin to manage our tool versions. Complete the setup for `asdf-vm` first, or make sure you have compatible equivalents installed.

After cloning, make sure you get the vendored dependencies:

```console
git submodule update --init
```

## Testing

Tests are written in [Jest](https://jestjs.io/). To run them:

```console
npm test
```

Add the `--watch` parameter to re-run the tests when changes are detected:

```console
npm test --watch
```
