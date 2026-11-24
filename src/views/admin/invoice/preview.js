import { CloseIcon } from "@chakra-ui/icons";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@chakra-ui/react";
import moment from "moment";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getApi } from "services/api";

const Preview = (props) => {
  const { onClose, isOpen, id, generatePDF, selectedId, isLoading } = props;
  const [invoiceDetails, setInvoiceDetails] = useState({});
  const [isLoding, setIsLoding] = useState(false);
  const largeLogo = useSelector((state) =>
    state?.images?.images?.filter((item) => item?.isActive === true),
  );

  const fetchInvoiceDetails = async () => {
    try {
      setIsLoding(true);
      let result = await getApi("api/invoices/view/", selectedId);
      if (result?.status === 200) {
        setInvoiceDetails(result?.data?.result);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoding(false);
    }
  };

  useEffect(() => {
    if (selectedId) fetchInvoiceDetails();
  }, [selectedId]);

  return (
    <Drawer isOpen={isOpen} size={"lg"}>
      <DrawerContent>
        <DrawerHeader
          alignItems={"center"}
          justifyContent="space-between"
          display="flex"
        >
          Invoice
          <IconButton onClick={() => onClose(false)} icon={<CloseIcon />} />
        </DrawerHeader>
        <DrawerBody>
          {!isLoding ? (
            <div id={id} style={{ padding: "5px" }}>
              <div className="invoice-container">
                <div style={{ marginBottom: 10 }}>
                  <h1 style={{ fontSize: 30, textAlign: "center" }}>Invoice</h1>
                </div>
                <div className="invoice-header">
                  <div>
                    <Image
                      style={{ width: "100%", height: "52px" }}
                      src={largeLogo[0]?.logoLgImg}
                      alt="Logo"
                      cursor="pointer"
                      userSelect="none"
                      my={2}
                    />
                  </div>
                  <div className="invoice-details">
                    <table>
                      <tr>
                        <th style={{ textAlign: "start" }}>Invoice No.</th>
                        <td>:</td>
                        <td style={{ textAlign: "start" }}>
                          {invoiceDetails?.invoiceNumber}
                        </td>
                      </tr>
                      <tr>
                        <th style={{ textAlign: "start" }}>Invoice Date</th>
                        <td>:</td>
                        <td style={{ textAlign: "start" }}>
                          {invoiceDetails?.invoiceDate &&
                            moment(invoiceDetails?.invoiceDate).format(
                              "DD-MM-YYYY",
                            )}
                        </td>
                      </tr>
                      <tr>
                        <th style={{ textAlign: "start" }}>Name</th>
                        <td>:</td>
                        <td style={{ textAlign: "start" }}>
                          {invoiceDetails?.title}
                        </td>
                      </tr>
                      <tr>
                        <th style={{ textAlign: "start" }}>Status</th>
                        <td>:</td>
                        <td style={{ textAlign: "start" }}>
                          {invoiceDetails?.status}
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>
                <div className="totals">
                  <table>
                    <tr>
                      <th style={{ textAlign: "start" }}>Grand Total</th>
                      <td>:</td>
                      <td
                        style={{ textAlign: "start" }}
                      >{`${invoiceDetails?.currency} ${invoiceDetails?.grandTotal || 0}`}</td>
                    </tr>
                  </table>
                </div>
                <div className="footer">
                  <div>{invoiceDetails?.description}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Spinner />
            </div>
          )}
        </DrawerBody>
        <DrawerFooter>
          <Button
            sx={{ textTransform: "capitalize" }}
            size="sm"
            disabled={isLoading}
            variant="brand"
            type="submit"
            onClick={generatePDF}
          >
            {isLoading ? <Spinner /> : "Download"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default Preview;
