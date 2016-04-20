## Command Line
All of these are **optional**:

* `-o`: Open the browser on the server
* `-d <directory>` : Specify a working directory
* `-p <pathToTsconfig>`: Specify a path to the active project. [More](./tsconfig.md)
* `-t <port>`: Specify a custom port number
* `-i`: Creates a new project file and exits. Allows you to give `alm` a quick go on an existing code base.
[](* `-b`: Builds the project and exits. Allows you to run `alm` on a build server.)
* `--safe`: To ignore any previous session data in `.alm` folder

If you want to host the server publicly here are few more options that are helpful (again completely **optional**):

* `--httpskey`: path to a `.key` file
* `--httpscert`: path to a `.cert` file
* `--host`: By default we listen on `0.0.0.0` i.e. all local host names. You can restrict that by providing your own name e.g. `foo-pac-machine`
* `--auth`: `username:password` e.g. `--auth someusername:somepassword` (alias `-a`)
