class InvalidActionError extends Error {
    constructor(name, message, cause) {
        super(message);
        this.type = 'InvalidActionError';
        this.name = name;
        this.cause = cause;
    }

    toString() {
        return (JSON.stringify({
            'name': this.name,
            'type': this.type,
            'message': this.message,
            'cause': this.cause,
        }));
    }
}

const multisigAccountDidNotExistError = 'MultisigAccountDidNotExistError';
const accountDidNotExistError = 'AccountDidNotExistError';
const accountWasNotMultisigError = 'AccountWasNotMultisigError';
const blockDidNotExistError = 'BlockDidNotExistError';
const transactionDidNotExistError = 'TransactionDidNotExistError';
const transactionBroadcastError = 'TransactionBroadcastError';

module.exports = {
    InvalidActionError,
    multisigAccountDidNotExistError,
    accountDidNotExistError,
    accountWasNotMultisigError,
    blockDidNotExistError,
    transactionDidNotExistError,
    transactionBroadcastError,
};
