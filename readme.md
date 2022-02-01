# BarkleyREI Audit

Can audit a generator-created project.

Currently, it scans the compiled HTML files in the deployed folder and audits them using aXe and HTML CodeSniffer. It uses Pa11y to run these tests.

After a scan, a directory is generated with an index file and a subfolder of the completed tests.

## Usage

Install globally with npm

`npm install -g brei-audit`

Navigate to the base folder of a generated project. This is the same folder as `package.json` and `_config`.

Run the audit command.

`brei-audit`

Wait for the scan to complete. A browser window will open automatically.

Currently only tested on OS 11.
