import fs from "fs"

const path = "save.txt"

const save = "\n# this file stores chat cooldown and bans made in the settings\n\n" +
    "# this is not the same thing as config.js!!!! use config.js instead of this to configure things!!!\n" +
    "# please do not edit the contents of this file\n" +
    "# but you're welcome to delete the file to reset it\n\n"

export function createSave() {
    //create a save only when there isn't one
    try {
        if (!fs.existsSync(path)) {
            fs.appendFile(path, save, function (err) {
                if (err) throw err;
                console.log('save.txt | sucessfully created');
            });
        } else {
            console.log('save.txt | already exists');
        }
    } catch (err) {
        console.log("save.txt | " + err)
    }
}

//writeSave("cooldown", 2)
export function writeSave(config, value) {
    //if config already exists, write over it
    if (readSave(config) !== false) {
        let array = fs.readFileSync(path).toString().split("\n");
        for (i in array) {
            if (array[i].includes(config + "|"))
                array[i] = `${config}|${value}`
        }

        fs.writeFileSync(path, array.join('\n'));

        console.log(`save.txt | replaced config: "${config}" value: "${value}"`);
    } else {
        fs.appendFile(path, `${config}|${value}\n`, function (err) {
            if (err) throw err;
            console.log(`save.txt | new config: "${config}" value: "${value}"`);
        });
    }
}

//deleteSave("cooldown")
export function deleteSave(config) {
    //if config exists, delete it
    if (readSave(config) !== false) {
        let array = fs.readFileSync(path).toString().split("\n");
        for (i in array) {
            if (array[i].includes(config + "|"))
                array.splice(i, 1)
        }

        fs.writeFileSync(path, array.join('\n'));

        console.log(`save.txt | deleted config: "${config}"`);
    }
}

//readSave("cooldown") returns 2
export function readSave(config) {
    if (!fs.existsSync(path))
        return false
    let value = false
    let array = fs.readFileSync(path).toString().split("\n");
    for (i in array) {
        if (array[i].includes(config + "|"))
            value = array[i].substring(array[i].indexOf("|") + 1)
    }
    return value
}