function SearchBar({ value, onChange }) {
    const [searchInput, setSearchInput] = React.useState(value || '');

    React.useEffect(() => {
        setSearchInput(value || '');
    }, [value]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onChange(searchInput.trim());
        }, 200);

        return () => clearTimeout(timer);
    }, [searchInput]);

    return (
        <div className="search-bar">
            <input
                type="text"
                placeholder="Tìm theo tên, thư điện tử, địa chỉ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '16px' }}
            />
        </div>
    );
}
