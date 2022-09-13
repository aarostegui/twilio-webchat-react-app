import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useSelector } from "react-redux";
import { Message, User } from "@twilio/conversations";

import { ConversationEnded, getTranscriptData, generateTranscript, Transcript } from "../ConversationEnded";
import * as genericActions from "../../store/actions/genericActions";
import { sessionDataHandler } from "../../sessionDataHandler";
import { EngagementPhase } from "../../store/definitions";

jest.mock("react-redux", () => ({
    ...jest.requireActual("react-redux"),
    useDispatch: () => jest.fn(),
    useSelector: jest.fn()
}));

jest.mock("../../sessionDataHandler", () => ({
    sessionDataHandler: {
        clear: jest.fn()
    }
}));

const user1 = {
    identity: "identity 1",
    friendlyName: "name 1"
};
const user2 = {
    identity: "identity 2",
    friendlyName: "name 2"
};
const message1 = {
    index: 0,
    author: user1.identity,
    dateCreated: new Date("01/01/2021"),
    body: "message 1"
};
const message2 = {
    index: 1,
    author: user2.identity,
    dateCreated: new Date("01/02/2021"),
    body: "message 2"
};

const defaultState = {
    chat: {
        conversation: {
            dateCreated: message1.dateCreated,
            getMessagesCount: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn()
        },
        conversationsClient: { user: user1 },
        messages: [message1, message2],
        participants: [],
        users: [user1, user2]
    }
};

describe("Conversation Ended", () => {
    const newChatButtonText = "Start new chat";
    const downloadTranscriptButtonText = "Download transcript";

    beforeEach(() => {
        (useSelector as jest.Mock).mockImplementation((callback: any) => callback(defaultState));
    });

    it("renders conversation ended", () => {
        const { container } = render(<ConversationEnded />);

        expect(container).toBeInTheDocument();
    });

    it("renders the new chat button", () => {
        const { queryByText } = render(<ConversationEnded />);
        const newChatButton = queryByText(newChatButtonText);

        expect(newChatButton).toBeInTheDocument();
    });

    it("renders the download transcript button", () => {
        const { queryByText } = render(<ConversationEnded />);
        const newTranscriptButton = queryByText(downloadTranscriptButtonText);

        expect(newTranscriptButton).toBeInTheDocument();
    });

    it("clears session data on new chat button click", () => {
        const clearSessionDataSpy = jest.spyOn(sessionDataHandler, "clear");

        const { queryByText } = render(<ConversationEnded />);
        const newChatButton = queryByText(newChatButtonText) as Element;

        fireEvent.click(newChatButton);

        expect(clearSessionDataSpy).toHaveBeenCalled();
    });

    it("changes engagement phase to engagement form on new chat button click", () => {
        const changeEngagementPhaseSpy = jest.spyOn(genericActions, "changeEngagementPhase");

        const { queryByText } = render(<ConversationEnded />);
        const newChatButton = queryByText(newChatButtonText) as Element;
        fireEvent.click(newChatButton);

        expect(changeEngagementPhaseSpy).toHaveBeenCalledWith({ phase: EngagementPhase.PreEngagementForm });
    });

    it("retrieves transcript data from store", () => {
        const expectedResult = [
            { attachedMedia: undefined, author: "name 1", body: "message 1", timeStamp: new Date("01/01/2021") },
            { attachedMedia: undefined, author: "name 2", body: "message 2", timeStamp: new Date("01/02/2021") }
        ];
        expect(getTranscriptData(defaultState.chat.messages as Message[], defaultState.chat.users as User[])).toEqual(expectedResult);
    });

    it("generates transcript", () => {
        const transcriptData: Transcript[] = [
            { author: "John", body: "hi", timeStamp: new Date("December 17, 2022 04:30:10"), attachedMedia: null },
            { author: "Ben", body: "hi", timeStamp: new Date("December 20, 2022 03:24:00"), attachedMedia: null }
        ];
        expect(generateTranscript(transcriptData)).toEqual(
            `Conversation with John\n\nDate: 17 December 2022\nDuration: 2 days 22 hours 50 seconds \n\n* 04:30  John: hi\n\n+ 03:24  Ben: hi\n\n`
        );
    });
});
