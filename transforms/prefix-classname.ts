import { Transform } from 'jscodeshift';

const transform: Transform = (file, api, option) => {
    // Alias the jscodeshift API for ease of use.
    const j = api.jscodeshift;

    // Convert the entire file source into a collection of nodes paths.
    const root = j(file.source);

    const filePrefixMap = {};
    let hasModifications = false;
    
    root
        // Find all JSX elements like div and other custom jsx element...
        .findJSXElements()
        // with an `classname` property having a string value...
        .find(j.JSXAttribute, {
            name: {
                type: "JSXIdentifier",
                name: "className"
            },
            value: {
                type: "Literal"
            }
        })
        .find(j.Literal)
        .replaceWith(nodePath => {
            const { node } = nodePath;
            const fileName = getFileName(file.path);

            // map prefix for a file, we don't want seperate random digit in each class prefix
            if (!filePrefixMap[fileName]) {
                filePrefixMap[fileName] = getClassPrefix(fileName)
            }

            const classPrefix = filePrefixMap[fileName];
            const oldClassName = node.value.toString();
            
            if (!oldClassName || oldClassName.includes(classPrefix)) {
                return j.stringLiteral(oldClassName);
            }

            // eg: "Header Title" -> "fn43Header fn43Title"
            const newClassName = addPrefix(oldClassName, classPrefix);
            hasModifications = true;

            // with a new JSX expression with the prefix included in classname.
            return j.stringLiteral(newClassName);
        });

    return hasModifications ? root.toSource() : null;
}

const getFileName = (path: string) => {
    if (!path) return path;
    const pathArray = path.split('/');
    return pathArray[pathArray.length - 1];
};

const getClassPrefix = (fileName: string) => {
    const prefixChars = fileName
        // Removes text from last '.', important for removing extention
        .replace(/\.[^.$]+$/, '')
        // Seperate the string Ex. someFileName => some File Name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // handles IFSCCOde => IFSC Code
        .replace(/([A-Z])([a-z])/g, ' $1$2')
        // Replace '.' or '-' with space Ex. basic.input => 'basic input"
        .replace(/([.-])/g, ' ')
        // Split via space
        .split(' ')
        // map each word with their starting character [ 'basic', 'input'] => [ 'b', 'i']
        .map(word => word.charAt(0))
        // join them now => 'bi'
        .join('')
        // convert to lower case
        .toLowerCase();

    const randomTwoDigits = Math.floor(Math.random() * 90 + 10)
    return `${prefixChars}${randomTwoDigits}`;
}

const addPrefix = (oldClass, prefix) => {
    oldClass = oldClass.split(' ');
    return oldClass
        .map(className => `${prefix}${className}`)
        .join(' ');
}

export default transform;