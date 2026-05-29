import React, { useState } from 'react';
import LibraryCommand from './LibraryCommand';
import BookRPGProfile from './BookRPGProfile';

export default function LibraryIndex() {
    const [selectedBook, setSelectedBook] = useState(null);

    return (
        <div className="w-full relative h-[100dvh]">
            {!selectedBook ? (
                <LibraryCommand onOpenBook={setSelectedBook} />
            ) : (
                <BookRPGProfile book={selectedBook} onClose={() => setSelectedBook(null)} />
            )}
        </div>
    );
}
