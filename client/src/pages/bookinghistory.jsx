import useFadeScroll from "../hooks/useFadeScroll";


export default function BookingHistory() {
  useFadeScroll();
  return (
    <main>
      <div className="container">
        <h2>Your Booking History</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Resource</th>
              <th>Date</th>
              <th>Start time</th>
              <th>End time</th>
              <th>Purpose</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td><span className="badge badge-classroom"></span></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td className="status-approved"></td>
            </tr>
          </tbody>
        </table>
      </div>
      
    </main>
  );
}



