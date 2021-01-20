/**
 * Instagram Helper
 */
class InstagramHelper {

    /**
     * default constructor
     */
    constructor() {
        this.p_userId = this.getCookie("ds_user_id");

        this.p_itemsIdArray = [];
        if (localStorage.getItem('messages_ids') != undefined) {
            this.p_itemsIdArray = localStorage.getItem('messages_ids').split(',');
        } else {
            localStorage.setItem('messages_ids', this.p_itemsIdArray);
        }

        this.deletedItemIdArray = [];
        if (localStorage.getItem('deleted_messages_ids') != undefined) {
            this.deletedItemIdArray = localStorage.getItem('deleted_messages_ids').split(',');
        } else {
            localStorage.setItem('deleted_messages_ids', this.deletedItemIdArray);
        }

        this.p_oldestCursor = "";
        this.p_prevCursor = "";
        this.getConsumerLibCommonsJs();
        this.stopGettingMessages = false;
        this.stopDeletingMessages = false;
    }

    syncWait = ms => {
        const end = Date.now() + ms
        while (Date.now() < end) continue
    }

    /**
     * provides cookie value if exists else provides empty string
     * @param {string} c_name cookie key name
     */
    getCookie(c_name) {
        if (document.cookie.length > 0) {
            var c_start = document.cookie.indexOf(c_name + "=");
            if (c_start != -1) {
                c_start = c_start + c_name.length + 1;
                var c_end = document.cookie.indexOf(";", c_start);
                if (c_end == -1) {
                    var c_end = document.cookie.length;
                }
                return unescape(document.cookie.substring(c_start, c_end));
            }
        }
        return "";
    }

    /**
     * generates random integer between 1 and provided
     * @param {number} maxNumber max number between which to generate random integer (default value is 10)
     */
    getRandomIntegerBetween(maxNumber) {
        if (maxNumber != undefined && maxNumber != null && maxNumber > 0) {
            // its provided
        } else {
            maxNumber = 10;
        }
        return Math.floor((Math.random() * maxNumber) + 1);

    }

    /**
     * provides the ConsumerLibCommon Js File
     * @param {string} jsFileName default is d7e6aac102d8.js
     */
    async getConsumerLibCommonsJs(jsFileName = "d7e6aac102d8.js") {

        let consumerLibCommonsJsRequestUrl = "https://www.instagram.com/static/bundles/es6/ConsumerLibCommons.js/" + jsFileName;
        let consumerLibCommonsJsRequestInit = {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1"
            },
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        };

        await fetch(
            consumerLibCommonsJsRequestUrl,
            consumerLibCommonsJsRequestInit
        )
            .then((response) => {
                if (response.status != 200) {
                    console.error("Try again tomorrow");
                } else {
                    return response.text();
                }
            })
            .then((data) => {
                let appIdVariableNames = [
                    "instagramFBAppId",
                    "instagramWebFBAppId",
                    "instagramWebDesktopFBAppId",
                    "igLiteAppId"
                ];

                appIdVariableNames.forEach(singleppIdVariableName => {
                    let searchString = singleppIdVariableName + "='";
                    let indexOfSearchedStringVariableName = data.indexOf(searchString);
                    let valueData = data.substring(indexOfSearchedStringVariableName + searchString.length);
                    let singleAppIdValue = valueData.substring(0, valueData.indexOf("'"));
                    // console.warn(singleppIdVariableName + " = " + singleAppIdValue);
                    localStorage.setItem(singleppIdVariableName, singleAppIdValue);
                });
            });
    }


    /**
     * Fetch the messages and its itemIds
     */
    async getAllMessageIds(threadId) {

        if (threadId == null || threadId == undefined) {
            console.error("threadId must be passed");
            return false;
        }

        let threadLink = "https://www.instagram.com/direct/t/" + threadId;

        // if its first message ever sent then stop else continue
        while (this.p_prevCursor != "MINCURSOR" && this.stopGettingMessages == false) {

            // var getMessageAPIUrl = "https://www.instagram.com/direct_v2/web/threads/" + threadId + "/";
            var getMessageAPIUrl = "https://i.instagram.com/api/v1/direct_v2/threads/" + threadId + "/";
            if (this.p_oldestCursor != undefined && this.p_oldestCursor != null && this.p_oldestCursor.length > 0) {
                getMessageAPIUrl = getMessageAPIUrl + "?cursor=" + this.p_oldestCursor + "";
            }

            var getMessagesRequestInit = {
                "credentials": "include",
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9",
                    "cache-control": "no-cache",
                    "pragma": "no-cache",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-ig-app-id": localStorage.getItem("instagramWebFBAppId"),
                    "x-ig-www-claim": sessionStorage.getItem("www-claim-v2"),
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrer": threadLink,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": null,
                "method": "GET",
                "mode": "cors"
            };

            await fetch(
                getMessageAPIUrl,
                getMessagesRequestInit
            )
                .then((response) => {
                    if (response.status != 200) {
                        console.error("Try again tomorrow");
                        throw response.status;
                    } else {
                        return response.json();
                    }
                })
                .then((data) => {
                    // console.log(data);
                    console.log("getting messages...");
                    data.thread.items.forEach(element => {
                        if (element.user_id.toString() == this.p_userId.toString()) {
                            if (!this.p_itemsIdArray.includes(element.item_id.toString())) {
                                this.p_itemsIdArray.push(element.item_id.toString());
                            }
                        }
                    });

                    this.p_oldestCursor = data.thread.oldest_cursor;
                    this.p_prevCursor = data.thread.prev_cursor;

                })
                .catch((error) => {
                    console.error(error);
                    return false;
                });

        }

        localStorage.setItem('messages_ids', this.p_itemsIdArray);
        console.warn("All Messages fetched, No More messages to fetch");
        return true;
    }

    async startUnsending(threadId, delay = 3500) {
        if (threadId == null || threadId == undefined) {
            console.error("threadId must be passed");
            return false;
        }

        console.warn("Inevitable");

        let threadLink = "https://www.instagram.com/direct/t/" + threadId;

        // if its first message ever sent then stop else continue
        while (this.p_prevCursor != "MINCURSOR") {

            var getMessageAPIUrl = "https://i.instagram.com/api/v1/direct_v2/threads/" + threadId + "/";
            if (this.p_oldestCursor != undefined && this.p_oldestCursor != null && this.p_oldestCursor.length > 0) {
                getMessageAPIUrl = getMessageAPIUrl + "?cursor=" + this.p_oldestCursor + "";
            }

            var getMessagesRequestInit = {
                "credentials": "include",
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9",
                    "cache-control": "no-cache",
                    "pragma": "no-cache",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-ig-app-id": localStorage.getItem("instagramWebFBAppId"),
                    "x-ig-www-claim": sessionStorage.getItem("www-claim-v2"),
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrer": threadLink,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": null,
                "method": "GET",
                "mode": "cors"
            };

            await fetch(
                getMessageAPIUrl,
                getMessagesRequestInit
            )
                .then(async (response) => {
                    if (response.status != 200) {
                        console.error("Try again tomorrow");
                    } else {
                        return response.json();
                    }
                })
                .then(async (data) => {
                    // console.log(data);

                    let itemIdsToDelete = [];

                    console.log("getting messages...");
                    data.thread.items.forEach(element => {
                        if (element.user_id.toString() == this.p_userId.toString()) {
                            if (!itemIdsToDelete.includes(element.item_id.toString())) {
                                itemIdsToDelete.push(element.item_id.toString());
                            }
                        }
                    });

                    //#region  Deleting Messages

                    for (let itemIdIndex = 0; itemIdIndex < itemIdsToDelete.length; itemIdIndex++) {
                        const messageItemId = itemIdsToDelete[itemIdIndex];

                        var p_unsendRequestInitObj = {
                            "credentials": "include",
                            "headers": {
                                "accept": "*/*",
                                "accept-language": "en-US,en;q=0.9",
                                "cache-control": "no-cache",
                                "content-type": "application/x-www-form-urlencoded",
                                "pragma": "no-cache",
                                "sec-fetch-dest": "empty",
                                "sec-fetch-mode": "cors",
                                "sec-fetch-site": "same-origin",
                                "x-csrftoken": this.getCookie("csrftoken"),
                                "x-ig-app-id": localStorage.getItem("instagramWebFBAppId"),
                                "x-ig-www-claim": sessionStorage.getItem("www-claim-v2"),
                                "x-requested-with": "XMLHttpRequest"
                            },
                            "referrer": threadLink,
                            "referrerPolicy": "no-referrer-when-downgrade",
                            "body": null,
                            "method": "POST",
                            "mode": "cors"
                        };

                        await fetch(
                            "https://i.instagram.com/api/v1/direct_v2/threads/" + threadId + "/items/" + messageItemId + "/delete/",
                            p_unsendRequestInitObj
                        ).then((response) => {
                            if (response.status != 200) {
                                console.error("Some messages skipped");
                            } else {
                                console.info("Deleting...");
                            }
                        }).catch((error) => {
                            console.error(error);
                        });

                        this.syncWait(delay);

                    }

                    //#endregion Deleting Messages

                    this.p_oldestCursor = data.thread.oldest_cursor;
                    this.p_prevCursor = data.thread.prev_cursor;

                })
                .catch((error) => {
                    console.error(error);
                });

        }

        console.warn("All messages deleted.");
        return true;

    }

    /**
     * Deletes all the follow requests for private account
     * @param {string} deleteButtonCSSClassName | provide the css class name of Delete button by Inspect Element
     */
    async deleteAllFollowRequests(deleteButtonCSSClassName) {

        let t = document.getElementsByClassName(deleteButtonCSSClassName);

        for (let index = 0; index < t.length; index++) {
            const element = t[index];
            this.syncWait(1000);
            element.click();
        }

    }

}
