declare module 'globby' {
  function Globby (pattern: string | string[], cb: (err: Error, matches: string[]) => void): void
  function Globby (pattern: string | string[], options: Globby.IOptions, cb: (err: Error, matches: string[]) => void): void

  module Globby {
    function sync (pattern: string | string[], options?: IOptions): string[]

    interface IOptions {
      cwd?: string
      root?: string
      dot?: boolean
      nomount?: boolean
      mark?: boolean
      nosort?: boolean
      stat?: boolean
      silent?: boolean
      strict?: boolean
      sync?: boolean
      nounique?: boolean
      nonull?: boolean
      debug?: boolean
      nobrace?: boolean
      noglobstar?: boolean
      noext?: boolean
      nocase?: boolean
      nodir?: boolean
      follow?: boolean
      realpath?: boolean
      nonegate?: boolean
      nocomment?: boolean
    }

  }

  export = Globby
}