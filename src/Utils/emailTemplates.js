export const generateEmailTemplate = (templateType, data) => {
  const { tenantName, ownerName, ownerPhone, customMessage, invoiceDetails } = data;

  // 🟢 Helper function to force 2 decimal places safely
  const formatAmt = (amt) => Number(amt || 0).toFixed(2);

  const baseHeader = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                        <div style="background-color: #0F172A; padding: 20px; text-align: center; color: #FACC15;">
                          <h2 style="margin: 0; font-size: 24px;">OneSquare Feet</h2>
                        </div>
                        <div style="padding: 30px; color: #333;">
                          <p style="font-size: 16px;">Dear <strong>${tenantName}</strong>,</p>`;

  const baseFooter = `    <p style="margin-top: 30px;">Best regards,</p>
                          <p style="margin: 5px 0;"><strong>${ownerName}</strong></p>
                          <p style="margin: 5px 0; color: #64748b;">${ownerPhone}</p>
                        </div>
                      </div>`;

  switch (templateType) {
    case 'welcomeTemplate':
      return {
        subject: `Welcome to your new property! - OneSquare Feet`,
        html: `${baseHeader}
               <p>Welcome! We are thrilled to have you as our new tenant. Your lease has been successfully activated in our system.</p>
               <p>If you have any questions or need maintenance support, please feel free to reach out.</p>
               ${customMessage ? `<div style="background: #f8fafc; padding: 15px; border-left: 4px solid #FACC15;">${customMessage}</div>` : ''}
               ${baseFooter}`
      };

    case 'reminderTemplate':
      // 🟢 Check if it's an electricity bill
      const isElectric = invoiceDetails?.billType?.toUpperCase() === 'ELECTRICITY';
      let electricHtml = '';
      
      // 🟢 If Electricity, prepare the extra rows
      if (isElectric && invoiceDetails?.electricUnits != null) {
        electricHtml = `
          <p style="margin: 5px 0;"><strong>Units Consumed:</strong> ${invoiceDetails.electricUnits} Units</p>
          <p style="margin: 5px 0;"><strong>Rate per Unit:</strong> ₹${formatAmt(invoiceDetails.electricRate)}</p>
        `;
      }

      return {
        subject: `Payment Reminder: ₹${formatAmt(invoiceDetails?.amountDue)} Due - OneSquare Feet`,
        html: `${baseHeader}
               <p>This is a friendly reminder regarding your pending <strong style="text-transform: capitalize;">${invoiceDetails?.billType?.toLowerCase()}</strong> bill for <strong>${invoiceDetails?.billingMonth}</strong>.</p>
               <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                 <p style="margin: 5px 0;"><strong>Invoice No:</strong> ${invoiceDetails?.invoiceNo}</p>
                 
                 ${electricHtml}
                 
                 <p style="margin: 5px 0;"><strong>Total Billed:</strong> ₹${formatAmt(invoiceDetails?.totalAmount)}</p>
                 <p style="font-size: 18px; color: #dc2626; margin-top: 15px; margin-bottom: 5px;"><strong>Amount Due: ₹${formatAmt(invoiceDetails?.amountDue)}</strong></p>
               </div>
               ${customMessage ? `<p><strong>Note from owner:</strong> ${customMessage}</p>` : '<p>Please arrange for the payment at your earliest convenience.</p>'}
               ${baseFooter}`
      };

    case 'customNoticeTemplate':
      return {
        subject: `Important Notice from ${ownerName}`,
        html: `${baseHeader}
               <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #0F172A; white-space: pre-wrap;">
                 ${customMessage}
               </div>
               ${baseFooter}`
      };

    default:
      throw new Error("Invalid email template type provided.");
  }
};