import { useState } from 'react';
export default ({ onChange }) => {
    return (
        <div className="file-input">
            <div>choose file</div>
            <input type="file" accept="audio/*,.mp3,.wav" onChange={onChange} />
        </div>
    )
}