class MessageInfo {
    constructor (
        {
            sourceActor,
            isCrit
        }
    ) {
        this.sourceActor = sourceActor;
        this.isCrit = isCrit
    }
}



/**
 * @param {ChatMessage} data
 * @return {null|MessageInfo}
 */
export function getMessageInfo (data) {
    let chatMessageDataContent = data.content ?? '';
    // Parse the chat message as XML so that we can navigate through it
    const parser = new DOMParser();
    const chatMessage = parser.parseFromString(chatMessageDataContent, "text/html");

    // try to get macro details from reroll data
    // reroll data is embedded in the chat message under the reroll link in the `data-macro` attribute of the reroll <a> tag.
    // the reroll data is a JSON string that has been `encodeURIComponent`'d and then base64-encoded.
    let encodedRerollData = chatMessage.querySelectorAll("[data-macro]")?.[0]?.getAttribute("data-macro");

    const result = chatMessage.querySelector("span.dice-total.lancer-dice-total.major").textContent;
    const rerollData = JSON.parse(decodeURIComponent(atob(encodedRerollData)));
    if (rerollData.fn === "prepareEncodedAttackMacro" || rerollData.fn === "prepareTechMacro") {
        return new MessageInfo({
            sourceActor: data.speaker.actor,
            isCrit: result >= 20
        });
    }


    if (rerollData.fn === "prepareActivationMacro") {
        const [sourceInfo, triggeringItemId, , actionName] = rerollData.args;

        const sourceToken = _getTokenByIdOrActorId(sourceInfo);

        let triggeringItem = sourceToken.actor.items.get(triggeringItemId);
        if (!triggeringItem) return null;

        if (!["Invade", "Full Tech", "Quick Tech"].includes(triggeringItem.system.actions[actionName].activation)) return null;

        return new MessageInfo({
            sourceActor: data.speaker.actor,
            isCrit: result >= 20
        });
    }

    // we don't serve your kind here
    return null;
}
