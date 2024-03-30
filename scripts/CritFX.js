import {getMessageInfo} from "./messageParser.js";

// Register settings
// Hooks.on("init", () => {
//     game.settings.register("lancer-weapon-fx", "volume", {
//         name: "lancer-weapon-fx.Sound Volume",
//         hint: "lancer-weapon-fx.Sound Volume Hint",
//         scope: "world",
//         config: true,
//         type: Number,
//         range: {min: 0, max: 2, step: 0.1},
//         default: 1.0,
//     });

//     game.settings.register("lancer-weapon-fx", "debug-is-default-miss", {
//         name: "lancer-weapon-fx.Debug: Play Miss Animations by Default",
//         scope: "client",
//         config: true,
//         type: Boolean,
//         default: false,
//     });
// })

async function _executeMacroByName(
    macroName,
    sourceActor = {},
    {
        compendiumName = "crit-fx.critfx",
        messageId = null,
    } = {},
) {
    const pack = game.packs.get(compendiumName);
    if (pack) {
        const macro_data = (await pack.getDocuments()).find((i) => i.name === macroName)?.toObject();

        if (macro_data) {
            // Prepend the dynamic "messageId" value
            macro_data.command = `const messageId = "${messageId}";\n${macro_data.command}`;

            const temp_macro = new Macro(macro_data);
            temp_macro.ownership.default = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
            temp_macro.execute({actor: sourceActor});
        } else {
            ui.notifications.error("Lancer Weapon FX | Macro " + macroName + " not found");
        }
    } else {
        ui.notifications.error("Lancer Weapon FX | Compendium " + compendiumName + " not found");
    }
}

Hooks.once("sequencer.ready", async function () {
    // preload effects data
    await Sequencer.Preloader.preload([
    
    ], true);
    console.log('Lancer Crit FX | Effects preloaded');
});

// Every time a chat message is posted...
Hooks.on("createChatMessage", (data) => {
    if(game.user.id !== data.user.id) return

    const messageMeta = getMessageInfo(data);
    if (messageMeta == null) return;

    const {sourceActor, isCrit} = messageMeta;

    if(!isCrit) return;

    const macroName = sourceActor;
    if (!macroName) return;
  
    console.log(messageMeta);
    _executeMacroByName(macroName, sourceActor, {messageId: data._id}).then(null);
});
