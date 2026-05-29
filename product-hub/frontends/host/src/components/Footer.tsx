function Footer() {
    return (
        <footer className="bg-gray-800 text-white mt-auto">
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm">
                            © ProductHub. Built with Vite + Module Federation.
                        </p>
                    </div>
                    <div className="flex space-x-4 text-sm">
                        <span className="text-gray-400">Shell App</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-400">Product UI (Remote)</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-400">Promo UI (Remote)</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;