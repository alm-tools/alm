import * as workingDir from "../../disk/workingDir";
import * as fsu from "../../utils/fsu";

export function createEditorconfig(data:{}): Promise<{alreadyPresent: string}> {
    const defaultContents = `
[*.{js,jsx,ts,tsx}]
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = true
insert_final_newline = true
    `.trim();
    const filePath = workingDir.makeAbsolute('./.editorconfig');

    if (fsu.existsSync(filePath)){
        return Promise.resolve({alreadyPresent:filePath});
    }
    fsu.writeFile(filePath,defaultContents);
    return Promise.resolve({alreadyPresent:''});
}
