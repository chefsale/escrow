// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QRCodeGenerator
 * @dev Utility contract for generating QR code data for escrow confirmations
 */
library QRCodeGenerator {
    
    struct QRCodeData {
        uint256 escrowId;
        address buyer;
        address seller;
        uint256 amount;
        string itemDescription;
        uint256 timestamp;
        string confirmationCode;
    }
    
    /**
     * @dev Generate QR code data for escrow confirmation
     * @param _escrowId ID of the escrow payment
     * @param _buyer Address of the buyer
     * @param _seller Address of the seller
     * @param _amount Amount in escrow
     * @param _itemDescription Description of the item
     * @return QR code data as JSON string
     */
    function generateQRCodeData(
        uint256 _escrowId,
        address _buyer,
        address _seller,
        uint256 _amount,
        string memory _itemDescription
    ) internal pure returns (string memory) {
        QRCodeData memory qrData = QRCodeData({
            escrowId: _escrowId,
            buyer: _buyer,
            seller: _seller,
            amount: _amount,
            itemDescription: _itemDescription,
            timestamp: block.timestamp,
            confirmationCode: generateConfirmationCode(_escrowId, _buyer, _seller)
        });
        
        return buildJSONString(qrData);
    }
    
    /**
     * @dev Generate a unique confirmation code
     * @param _escrowId ID of the escrow payment
     * @param _buyer Address of the buyer
     * @param _seller Address of the seller
     * @return Confirmation code
     */
    function generateConfirmationCode(
        uint256 _escrowId,
        address _buyer,
        address _seller
    ) internal pure returns (string memory) {
        // Create a deterministic confirmation code based on escrow details
        bytes32 hash = keccak256(abi.encodePacked(_escrowId, _buyer, _seller, "ESCROW_CONFIRM"));
        
        // Convert to hex string and take first 8 characters
        string memory hexString = toHexString(uint256(hash));
        return substring(hexString, 0, 8);
    }
    
    /**
     * @dev Build JSON string from QRCodeData
     * @param _data QRCodeData struct
     * @return JSON string
     */
    function buildJSONString(QRCodeData memory _data) internal pure returns (string memory) {
        string memory json = string(abi.encodePacked(
            '{"escrowId":',
            uint2str(_data.escrowId),
            ',"buyer":"',
            addressToString(_data.buyer),
            '","seller":"',
            addressToString(_data.seller),
            '","amount":"',
            uint2str(_data.amount),
            '","itemDescription":"',
            _data.itemDescription,
            '","timestamp":',
            uint2str(_data.timestamp),
            ',"confirmationCode":"',
            _data.confirmationCode,
            '"}'
        ));
        
        return json;
    }
    
    /**
     * @dev Convert uint to string
     * @param _i uint to convert
     * @return String representation
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        
        return string(bstr);
    }
    
    /**
     * @dev Convert address to string
     * @param _addr Address to convert
     * @return String representation
     */
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        
        return string(str);
    }
    
    /**
     * @dev Convert uint to hex string
     * @param _i uint to convert
     * @return Hex string representation
     */
    function toHexString(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        
        uint256 temp = _i;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 16;
        }
        
        bytes memory buffer = new bytes(digits);
        for (uint256 i = digits; i > 0; i--) {
            buffer[i - 1] = bytes1(uint8(48 + _i % 16));
            if (_i % 16 >= 10) {
                buffer[i - 1] = bytes1(uint8(55 + _i % 16));
            }
            _i /= 16;
        }
        
        return string(buffer);
    }
    
    /**
     * @dev Extract substring from string
     * @param _str Original string
     * @param _start Start index
     * @param _end End index
     * @return Substring
     */
    function substring(string memory _str, uint256 _start, uint256 _end) internal pure returns (string memory) {
        bytes memory strBytes = bytes(_str);
        bytes memory result = new bytes(_end - _start);
        
        for (uint256 i = _start; i < _end; i++) {
            result[i - _start] = strBytes[i];
        }
        
        return string(result);
    }
}
