const crypto = require('crypto');

const generateEsewaSignature = (totalAmount, transactionId, productCode = 'EPAYTEST', secretKey = '8gBm/:&EnhH.1/q') => {
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionId},product_code=${productCode}`;
    const hash = crypto.createHmac('sha256', secretKey).update(message).digest('base64');
    return hash;
};

module.exports = {
    generateEsewaSignature
};
