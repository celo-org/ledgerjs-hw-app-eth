# @celo/hw-app-eth

## Original readme

## How to sync upstream

```bash

LEDGER_REPO=./submodules/ledger-live/libs/ledgerjs/packages/hw-app-eth

cp -R $LEDGER_REPO/src/* ./src/
```

- Then double-check (AKA copypaste) the `$LEDGER_REPO/package.json` dependencies and devDependencies to merge them with the ones in `./package.json`.
- `yarn install`
- re-apply the CIP64 logic (adjust lines) if lost. There's an example patch in `cip64.patch`
- `yarn build`

If yarn build fails, perhaps some dependencies changed types and need to be adjusted via a patch or yarn install
