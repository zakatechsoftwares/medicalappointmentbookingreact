import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  // PDFViewer,
} from "@react-pdf/renderer";
import { ReportDataType } from "../../redux/DataType/DataType";

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#E4E4E4",
    width: "100vh",
  },
  section: {
    margin: 10,
    padding: 10,
    width: "50%",
    // flexGrow: 1,
  },

  text: {
    textAlign: "justify",
  },
});

// Create Document Component
const PdfDownload = ({
  doctorName,
  speciality,
  name,
  phoneNumber,
  email,
}: ReportDataType) => (
  // <PDFViewer style={{ width: "100vw", height: "100vh" }}>
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text>
          <Text>
            Name: {name} {"\n"}
            Email: {email} {"\n"}
            Phone number: {phoneNumber} {"\n "}
            Doctor's name: {doctorName} {"\n"}
            Speciality: {speciality} {"\n"}
            {"\n "}
          </Text>
          Section #1 Lorem ipsum dolor sit amet consectetur adipisicing elit.
          Maxime mollitia, molestiae quas vel sint commodi repudiandae
          consequuntur voluptatum laborum numquam blanditiis harum quisquam eius
          sed odit fugiat iusto fuga praesentium optio, eaque rerum! Provident
          similique accusantium nemo autem. Veritatis obcaecati tenetur iure
          eius earum ut molestias architecto voluptate aliquam nihil, eveniet
          aliquid culpa officia aut! Impedit sit sunt quaerat, odit, tenetur
          error, harum nesciunt ipsum debitis quas aliquid. Reprehenderit, quia.
          Quo neque error repudiandae fuga? Ipsa laudantium molestias eos
          sapiente officiis modi at sunt excepturi expedita sint? Sed quibusdam
          recusandae alias error harum maxime adipisci amet laborum.
          Perspiciatis minima nesciunt dolorem! Officiis iure rerum voluptates a
          cumque velit quibusdam sed amet tempora. Sit laborum ab, eius fugit
          doloribus tenetur fugiat, temporibus enim commodi iusto libero magni
          deleniti quod quam consequuntur! Commodi minima excepturi repudiandae
          velit hic maxime doloremque. Quaerat provident commodi consectetur
          veniam similique ad earum omnis ipsum saepe, voluptas, hic voluptates
          pariatur est explicabo fugiat, dolorum eligendi quam cupiditate
          excepturi mollitia maiores labore suscipit quas? Nulla, placeat.
          Voluptatem quaerat non architecto ab laudantium modi minima sunt esse
          temporibus sint culpa, recusandae aliquam numquam totam ratione
          voluptas quod exercitationem fuga. Possimus quis earum veniam quasi
          aliquam eligendi, placeat qui corporis!
        </Text>
      </View>
      <View style={styles.section}>
        <Text>
          Section #2 Section #1 Lorem ipsum dolor sit amet consectetur
          adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi
          repudiandae consequuntur voluptatum laborum numquam blanditiis harum
          quisquam eius sed odit fugiat iusto fuga praesentium optio, eaque
          rerum! Provident similique accusantium nemo autem. Veritatis obcaecati
          tenetur iure eius earum ut molestias architecto voluptate aliquam
          nihil, eveniet aliquid culpa officia aut! Impedit sit sunt quaerat,
          odit, tenetur error, harum nesciunt ipsum debitis quas aliquid.
          Reprehenderit, quia. Quo neque error repudiandae fuga? Ipsa laudantium
          molestias eos sapiente officiis modi at sunt excepturi expedita sint?
          Sed quibusdam recusandae alias error harum maxime adipisci amet
          laborum. Perspiciatis minima nesciunt dolorem! Officiis iure rerum
          voluptates a cumque velit quibusdam sed amet tempora. Sit laborum ab,
          eius fugit doloribus tenetur fugiat, temporibus enim commodi iusto
          libero magni deleniti quod quam consequuntur! Commodi minima excepturi
          repudiandae velit hic maxime doloremque. Quaerat provident commodi
          consectetur veniam similique ad earum omnis ipsum saepe, voluptas, hic
          voluptates pariatur est explicabo fugiat, dolorum eligendi quam
          cupiditate excepturi mollitia maiores labore suscipit quas? Nulla,
          placeat. Voluptatem quaerat non architecto ab laudantium modi minima
          sunt esse temporibus sint culpa, recusandae aliquam numquam totam
          ratione voluptas quod exercitationem fuga. Possimus quis earum veniam
          quasi aliquam eligendi, placeat qui corporis!
        </Text>
      </View>
    </Page>
  </Document>
  // </PDFViewer>
);

export default PdfDownload;
