import * as workingDir from "../../disk/workingDir";
import * as fsu from "../../utils/fsu";

/** Warning: we just write if anything was there so be careful */
export function createEditorconfig(data:{}): Promise<{}> {
    const defaultContents = `
[*.{js,jsx,ts,tsx}]
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
insert_final_newline = true
    `.trim();
    const filePath = workingDir.makeAbsolute('./.editorconfig');

    fsu.writeFile(filePath,defaultContents);

    return Promise.resolve({});
}
