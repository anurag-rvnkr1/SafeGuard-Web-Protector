
        document.addEventListener('DOMContentLoaded', () => {
            loadWhitelist();
            
            document.getElementById('backBtn').addEventListener('click', () => {
                window.close();
            });
        });

        async function loadWhitelist() {
            try {
                const result = await chrome.storage.local.get({ whitelist: [] });
                const whitelist = result.whitelist;
                const container = document.getElementById('whitelistContainer');

                if (whitelist.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state"> 
                            <h3>No whitelisted domains</h3>
                            <p>Domains you choose to continue accessing will appear here.</p>
                            <p>When you encounter a blocked site and choose "Continue Anyway", it will be added to this list.</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = whitelist.map(domain => `
                    <div class="whitelist-item">
                        <span class="domain">${domain}</span>
                        <button class="remove-btn" onclick="removeDomain('${domain}')">Remove</button>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error loading whitelist:', error);
                document.getElementById('whitelistContainer').innerHTML = `
                    <div class="empty-state">
                        <h3>Error loading whitelist</h3>
                        <p>Please try refreshing the page.</p>
                    </div>
                `;
            }
        }

        async function removeDomain(domain) {
            if (confirm(`Remove ${domain} from whitelist?\n\nThis domain will be subject to blocking again.`)) {
                try {
                    const result = await chrome.storage.local.get({ whitelist: [] });
                    const whitelist = result.whitelist.filter(d => d !== domain);
                    await chrome.storage.local.set({ whitelist });
                    loadWhitelist();
                } catch (error) {
                    console.error('Error removing domain:', error);
                    alert('Error removing domain. Please try again.');
                }
            }
        }