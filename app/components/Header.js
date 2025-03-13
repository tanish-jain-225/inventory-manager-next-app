import React from 'react';

/**
 * Header component that displays the application title and logo
 * Appears at the top of all pages in the Inventory Management System
 * @returns {JSX.Element} Header with logo and application title
 */
const Header = () => {
    return (
        <header className="body-font bg-gray-400 p-2" role="banner">
            <div className="container flex py-2 items-center md:ml-4 mx-auto md:mx-0 w-[98%]">
                <div className="flex title-font font-medium text-black justify-center items-center p-[4px] mx-auto md:mx-0">
                    <img 
                        src="https://cdn-icons-png.flaticon.com/128/7656/7656411.png" 
                        alt="Inventory Management System Logo" 
                        width="30" 
                        height="30" 
                        className="m-2"
                    />
                    <h1 className="text-md md:text-lg">Inventory Management System</h1>
                </div>
            </div>
        </header>
    );
};

export default Header;