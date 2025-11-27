export default function Home() {
    return (
      <div style={{ padding: 40 }}>
        <h1>TAKA Systems — MVP is online :rocket:</h1>
        <p>Select your area:</p>
        <ul>
          <li><a href="/(public)">Public</a></li>
          <li><a href="/(tenant)">Tenant login</a></li>
          <li><a href="/(superadmin)">Superadmin</a></li>
        </ul>
      </div>
    );
  }